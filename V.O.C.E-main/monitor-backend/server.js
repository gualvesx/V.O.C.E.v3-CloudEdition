// ================================================================
//                            IMPORTS E CONFIGURAÇÃO INICIAL
// ================================================================
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');

const classifier = require('./python_classifier.js');

// Substitua pelo seu arquivo de credenciais do Firebase
const serviceAccount = require('./firebase-service-account.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const auth = getAuth();

const app = express();
const port = process.env.PORT || 3000;

// ================================================================
//                            CONFIGURAÇÃO DO EXPRESS
// ================================================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'segredo-muito-forte-aqui',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// ================================================================
//                            MIDDLEWARE
// ================================================================
const requireLogin = (req, res, next) => {
    if (req.session && req.session.uid) {
        return next();
    }
    res.redirect('/login');
};

app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ================================================================
//                            ROTAS PÚBLICAS E DE AUTENTICAÇÃO
// ================================================================

app.get('/', (req, res) => {
    res.render('landpage', {
        pageTitle: 'V.O.C.E - Monitorização Inteligente',
        isLoggedIn: !!req.session.uid
    });
});

app.get('/login', (req, res) => res.render('login', { error: null, message: req.query.message || null, pageTitle: 'Login - V.O.C.E' }));
app.get('/cadastro', (req, res) => res.render('cadastro', { error: null, pageTitle: 'Cadastro - V.O.C.E' }));

app.post('/createUser', async (req, res) => {
    const { email, password, fullName, username } = req.body;
    try {
        const userRecord = await auth.createUser({ email, password });
        await db.collection('professors').doc(userRecord.uid).set({
            full_name: fullName,
            username: username
        });
        res.status(201).json({ success: true, uid: userRecord.uid });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(400).json({ error: 'Não foi possível criar o usuário. Verifique os dados.' });
    }
});

app.post('/sessionLogin', async (req, res) => {
    const { idToken } = req.body;
    try {
        const decodedToken = await auth.verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        const professorDoc = await db.collection('professors').doc(uid).get();
        if (!professorDoc.exists) throw new Error('Professor não encontrado no Firestore.');

        req.session.uid = uid;
        req.session.professorName = professorDoc.data().full_name;
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Erro no login da sessão:', error);
        res.status(401).json({ error: 'Falha na autenticação.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// ================================================================
//          ROTA PARA RECEBER LOGS DA EXTENSÃO
// ================================================================
app.post('/api/logs', async (req, res) => {
    const logs = Array.isArray(req.body) ? req.body : [req.body];
    if (!logs || logs.length === 0) return res.status(400).send('Nenhum log recebido.');

    try {
        const batch = db.batch();
        for (const log of logs) {
            if (log.url && log.durationSeconds) {
                const category = await classifier.categorizar(log.url);
                const logRef = db.collection('logs').doc();
                batch.set(logRef, {
                    aluno_id: log.aluno_id,
                    url: log.url,
                    duration: log.durationSeconds,
                    timestamp: new Date(log.timestamp),
                    categoria: category
                });
            }
        }
        await batch.commit();
        console.log(`${logs.length} logs foram salvos no Firestore.`);
        res.status(200).send('Logs recebidos e processados com sucesso.');
    } catch (error) {
        console.error('Erro ao salvar logs no Firestore:', error);
        res.status(500).send('Erro interno ao processar os logs.');
    }
});

// ================================================================
//                            ROTAS PROTEGIDAS
// ================================================================

app.get('/dashboard', requireLogin, async (req, res) => {
    try {
        const { uid, professorName } = req.session;
        
        const classesSnapshot = await db.collection('classes').where('professor_id', '==', uid).orderBy('name').get();
        const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const logsSnapshot = await db.collection('logs').get();
        const categoriesSet = new Set();
        logsSnapshot.forEach(doc => {
            const categoria = doc.data().categoria;
            if (categoria) categoriesSet.add(categoria);
        });

        res.render('dashboard', { 
            pageTitle: 'Dashboard', 
            professorName, 
            classes, 
            categories: Array.from(categoriesSet).sort()
        });
    } catch (error) {
        console.error("Erro ao carregar o dashboard:", error);
        res.status(500).send("Erro ao carregar o dashboard.");
    }
});

app.get('/perfil', requireLogin, async (req, res) => {
    try {
        const { uid } = req.session;
        const doc = await db.collection('professors').doc(uid).get();
        if(!doc.exists) return res.redirect('/logout');
        res.render('perfil', {
            pageTitle: 'Meu Perfil',
            user: doc.data(),
            success: req.query.success
        });
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        res.status(500).send("Erro ao carregar perfil.");
    }
});

app.post('/perfil', requireLogin, async (req, res) => {
    const { fullName } = req.body;
    const { uid } = req.session;
    if (!fullName) return res.redirect('/perfil');
    try {
        await db.collection('professors').doc(uid).update({ full_name: fullName });
        req.session.professorName = fullName;
        res.redirect('/perfil?success=true');
    } catch (error) {
        console.error("Erro ao atualizar perfil:", error);
        res.status(500).send("Erro ao atualizar perfil.");
    }
});

// --- APIs DE GESTÃO (AGORA COM FIREBASE) ---
app.post('/api/classes', requireLogin, async (req, res) => {
    const { name } = req.body;
    const { uid } = req.session;
    if (!name) return res.status(400).json({ error: 'Nome da turma é obrigatório' });
    try {
        const docRef = await db.collection('classes').add({ name, professor_id: uid, student_ids: [] });
        res.json({ success: true, message: 'Turma criada com sucesso!', classId: docRef.id });
    } catch (error) {
        console.error('Erro ao criar turma:', error);
        res.status(500).json({ error: 'Erro ao criar turma' });
    }
});

app.put('/api/classes/:classId', requireLogin, async (req, res) => {
    const { classId } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'O novo nome da turma é obrigatório.' });
    try {
        const classRef = db.collection('classes').doc(classId);
        const doc = await classRef.get();
        if (!doc.exists || doc.data().professor_id !== req.session.uid) {
            return res.status(403).json({ error: 'Permissão negada.' });
        }
        await classRef.update({ name });
        res.json({ success: true, message: 'Nome da turma atualizado!' });
    } catch (error) {
        console.error('Erro ao atualizar turma:', error);
        res.status(500).json({ error: 'Erro ao atualizar a turma.' });
    }
});

app.delete('/api/classes/:classId', requireLogin, async (req, res) => {
    const { classId } = req.params;
    try {
        const classRef = db.collection('classes').doc(classId);
        const doc = await classRef.get();
        if (!doc.exists || doc.data().professor_id !== req.session.uid) {
            return res.status(403).json({ error: 'Permissão negada.' });
        }
        await classRef.delete();
        res.json({ success: true, message: 'Turma removida com sucesso!' });
    } catch (error) {
        console.error('Erro ao remover turma:', error);
        res.status(500).json({ error: 'Erro ao remover a turma.' });
    }
});

app.post('/api/students', requireLogin, async (req, res) => {
    const { fullName, cpf, pc_id } = req.body;
    if (!fullName) return res.status(400).json({ error: 'Nome do aluno é obrigatório' });
    try {
        const studentData = { full_name: fullName, cpf: cpf || null, pc_id: pc_id || null };
        const docRef = await db.collection('students').add(studentData);
        res.json({ success: true, message: 'Aluno criado com sucesso!', student: { id: docRef.id, ...studentData } });
    } catch (error) {
        console.error('Erro ao criar aluno:', error);
        res.status(500).json({ error: 'Erro ao criar aluno' });
    }
});

app.put('/api/students/:studentId', requireLogin, async (req, res) => {
    const { studentId } = req.params;
    const { fullName, cpf, pc_id } = req.body;
    if (!fullName) return res.status(400).json({ error: 'O nome do aluno é obrigatório.' });
    try {
        await db.collection('students').doc(studentId).update({ full_name: fullName, cpf: cpf || null, pc_id: pc_id || null });
        res.json({ success: true, message: 'Dados do aluno atualizados!' });
    } catch (error) {
        console.error('Erro ao atualizar aluno:', error);
        res.status(500).json({ error: 'Erro ao atualizar o aluno.' });
    }
});

app.get('/api/students/all', requireLogin, async (req, res) => {
    try {
        const snapshot = await db.collection('students').orderBy('full_name').get();
        const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(students);
    } catch (error) {
        console.error('Erro ao buscar todos os alunos:', error);
        res.status(500).json({ error: 'Erro ao buscar alunos' });
    }
});

app.get('/api/classes/:classId/students', requireLogin, async (req, res) => {
    try {
        const { classId } = req.params;
        const classDoc = await db.collection('classes').doc(classId).get();
        if (!classDoc.exists || classDoc.data().professor_id !== req.session.uid) {
            return res.status(403).json([]);
        }
        const studentIds = classDoc.data().student_ids || [];
        if (studentIds.length === 0) return res.json([]);
        
        const studentRefs = studentIds.map(id => db.collection('students').doc(id));
        const studentDocs = await db.getAll(...studentRefs);
        const students = studentDocs.filter(doc => doc.exists).map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(students);
    } catch (error) {
        console.error('Erro ao buscar alunos da turma:', error);
        res.status(500).json({ error: 'Erro ao buscar alunos da turma' });
    }
});

app.post('/api/classes/:classId/add-student', requireLogin, async (req, res) => {
    try {
        const { classId } = req.params;
        const { studentId } = req.body;
        const classRef = db.collection('classes').doc(classId);
        const classDoc = await classRef.get();
        if (!classDoc.exists || classDoc.data().professor_id !== req.session.uid) {
            return res.status(403).json({error: 'Permissão negada'});
        }
        const studentIds = classDoc.data().student_ids || [];
        if (!studentIds.includes(studentId)) {
            studentIds.push(studentId);
            await classRef.update({ student_ids: studentIds });
        }
        res.json({ success: true, message: 'Aluno adicionado à turma!' });
    } catch (error) {
        console.error('Erro ao adicionar aluno à turma:', error);
        res.status(500).json({ error: 'Erro ao associar aluno.' });
    }
});

app.delete('/api/classes/:classId/remove-student/:studentId', requireLogin, async (req, res) => {
    try {
        const { classId, studentId } = req.params;
        const classRef = db.collection('classes').doc(classId);
        const classDoc = await classRef.get();
        if (!classDoc.exists || classDoc.data().professor_id !== req.session.uid) {
            return res.status(403).json({error: 'Permissão negada'});
        }
        let studentIds = classDoc.data().student_ids || [];
        studentIds = studentIds.filter(id => id !== studentId);
        await classRef.update({ student_ids: studentIds });
        res.json({ success: true, message: 'Aluno removido da turma!' });
    } catch (error) {
        console.error('Erro ao remover aluno da turma:', error);
        res.status(500).json({ error: 'Erro ao remover aluno.' });
    }
});

// --- APIs DE DADOS (LOGS, ALERTAS, ETC.) ---
app.get('/api/logs/filtered', requireLogin, async (req, res) => {
    try {
        let query = db.collection('logs').orderBy('timestamp', 'desc');
        const snapshot = await query.get();
        let logs = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        
        const studentsSnapshot = await db.collection('students').get();
        const studentsMap = new Map();
        studentsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.cpf) studentsMap.set(data.cpf, data.full_name);
            if (data.pc_id) studentsMap.set(data.pc_id, data.full_name);
        });

        logs.forEach(log => {
            log.student_name = studentsMap.get(log.aluno_id) || `<i>${log.aluno_id}</i>`;
            if (log.timestamp && typeof log.timestamp.toDate === 'function') {
                log.timestamp = log.timestamp.toDate();
            }
        });
        
        res.json(logs);
    } catch (err) {
        console.error('ERRO na rota /api/logs/filtered:', err);
        res.status(500).json({ error: 'Erro ao consultar os logs.' });
    }
});

app.get('/api/users/summary', requireLogin, async (req, res) => {
    try {
        const logsSnapshot = await db.collection('logs').get();
        const studentsSnapshot = await db.collection('students').get();
        
        const studentsMap = new Map();
        studentsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.cpf) studentsMap.set(data.cpf, data.full_name);
            if (data.pc_id) studentsMap.set(data.pc_id, data.full_name);
        });

        const summary = {};

        logsSnapshot.forEach(doc => {
            const log = doc.data();
            const studentId = log.aluno_id;

            if (!summary[studentId]) {
                summary[studentId] = {
                    aluno_id: studentId,
                    student_name: studentsMap.get(studentId) || `<i>${studentId}</i>`,
                    total_duration: 0,
                    log_count: 0,
                    last_activity: new Date(0),
                    has_red_alert: 0,
                    has_blue_alert: 0
                };
            }

            summary[studentId].total_duration += log.duration;
            summary[studentId].log_count += 1;
            
            if (log.timestamp && typeof log.timestamp.toDate === 'function') {
                const logTimestamp = log.timestamp.toDate();
                if (logTimestamp > summary[studentId].last_activity) {
                    summary[studentId].last_activity = logTimestamp;
                }
            }

            if (['Rede Social', 'Jogos', 'Streaming', 'Animes e Manga'].includes(log.categoria)) {
                summary[studentId].has_red_alert = 1;
            }
            if (log.categoria === 'IA') {
                summary[studentId].has_blue_alert = 1;
            }
        });

        const summaryArray = Object.values(summary).sort((a, b) => b.last_activity - a.last_activity);
        res.json(summaryArray);

    } catch (err) {
        console.error('ERRO na rota /api/users/summary:', err);
        res.status(500).json({ error: 'Erro ao buscar resumo.' });
    }
});


app.get('/api/alerts/:alunoId/:type', requireLogin, async (req, res) => {
    try {
        const { alunoId, type } = req.params;
        let categories;
        if (type === 'red') {
            categories = ['Rede Social', 'Jogos', 'Streaming', 'Animes e Manga'];
        } else if (type === 'blue') {
            categories = ['IA'];
        } else {
            return res.status(400).json({ error: 'Tipo de alerta inválido.' });
        }
        
        const snapshot = await db.collection('logs')
            .where('aluno_id', '==', alunoId)
            .where('categoria', 'in', categories)
            .orderBy('timestamp', 'desc')
            .get();
            
        const logs = snapshot.docs.map(doc => {
            const data = doc.data();
            const timestamp = (data.timestamp && typeof data.timestamp.toDate === 'function')
                ? data.timestamp.toDate()
                : null;
            return {
                ...data,
                timestamp: timestamp
            }
        });
        res.json(logs);

    } catch (err) {
        console.error('ERRO na rota /api/alerts/:alunoId:', err);
        res.status(500).json({ error: 'Erro ao buscar logs de alerta.' });
    }
});


// Rota de fallback para erro 404
app.use((req, res) => res.status(404).send('Página não encontrada'));

// INICIALIZAÇÃO DO SERVIDOR
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse o dashboard em http://localhost:${port}/dashboard (após o login)`);
});

