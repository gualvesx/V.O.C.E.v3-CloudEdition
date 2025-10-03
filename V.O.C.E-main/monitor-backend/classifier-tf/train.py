# classifier-tf/train.py (VERSÃO AVANÇADA COM CNN)
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import pandas as pd
import pickle
import numpy as np

print("Iniciando o processo de treinamento avançado (CNN)...")

# 1. Carregar Dados
print("[1/5] Carregando dados...")
df = pd.read_csv('./classifier-tf/dataset.csv', names=['url', 'categoria'])
# Limpeza básica das URLs
urls = [str(url).lower().replace('www.', '') for url in df['url'].values]
labels = pd.get_dummies(df['categoria']).values
label_names = list(pd.get_dummies(df['categoria']).columns)

# 2. Pré-processamento com Keras Tokenizer
print("[2/5] Processando texto com Keras Tokenizer...")
MAX_NUM_WORDS = 2000
MAX_SEQUENCE_LENGTH = 100

tokenizer = Tokenizer(num_words=MAX_NUM_WORDS, char_level=True)
tokenizer.fit_on_texts(urls)
sequences = tokenizer.texts_to_sequences(urls)

X_data = pad_sequences(sequences, maxlen=MAX_SEQUENCE_LENGTH)

# 3. Construir o Modelo CNN
print("[3/5] Construindo o modelo CNN...")
model = tf.keras.Sequential([
    tf.keras.layers.Embedding(input_dim=MAX_NUM_WORDS, output_dim=64, input_length=MAX_SEQUENCE_LENGTH),
    tf.keras.layers.Conv1D(128, 5, activation='relu'),
    tf.keras.layers.GlobalMaxPooling1D(),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(len(label_names), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.summary()

# 4. Treinar o Modelo
print("[4/5] Treinando o modelo...")
# O batch_size define quantos exemplos a IA olha antes de ajustar seu aprendizado
model.fit(X_data, labels, epochs=20, batch_size=32, verbose=1)

# 5. Salvar o Modelo e os Metadados
print("[5/5] Salvando modelo e metadados...")
model.save('./classifier-tf/model_cnn.keras')
with open('./classifier-tf/tokenizer.pkl', 'wb') as f:
    pickle.dump(tokenizer, f)
with open('./classifier-tf/labels.pkl', 'wb') as f:
    pickle.dump(label_names, f)

print("Modelo CNN e metadados salvos com sucesso!")