# classifier-tf/predict.py (VERSÃO CORRIGIDA)
import sys
import tensorflow as tf
import pickle
import numpy as np

# --- ADIÇÃO NECESSÁRIA ---
# A função tokenizer precisa estar definida aqui também, para que o pickle
# consiga carregar o vetorizador que depende dela.
def url_tokenizer(url):
    clean_url = url.lower().replace('www.', '')
    return clean_url.split('.')
# -------------------------

# Carrega os artefatos salvos
model = tf.keras.models.load_model('./classifier-tf/model.keras')
with open('./classifier-tf/vectorizer.pkl', 'rb') as f:
    vectorizer = pickle.load(f)
with open('./classifier-tf/labels.pkl', 'rb') as f:
    label_names = pickle.load(f)

# Pega a URL passada como argumento pelo Node.js
url_to_classify = sys.argv[1]

# Processa a URL da mesma forma que no treinamento
vectorized_url = vectorizer.transform([url_to_classify]).toarray()

# Faz a predição
prediction = model.predict(vectorized_url, verbose=0)
predicted_index = np.argmax(prediction)
category = label_names[predicted_index]

# Imprime o resultado final. O Node.js irá capturar isso.
print(category)