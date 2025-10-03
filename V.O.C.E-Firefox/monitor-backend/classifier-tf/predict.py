# classifier-tf/predict.py (VERSÃO CORRIGIDA)
import sys
import tensorflow as tf
import pickle
import numpy as np
import json # Importa a biblioteca JSON

# Carrega os artefatos salvos
model = tf.keras.models.load_model('./classifier-tf/model_cnn.keras')
with open('./classifier-tf/tokenizer.pkl', 'rb') as f:
    tokenizer = pickle.load(f)
with open('./classifier-tf/labels.pkl', 'rb') as f:
    label_names = pickle.load(f)

# Pega a URL passada como argumento pelo Node.js
url_to_classify = sys.argv[1]

# Processa a URL da mesma forma que no treinamento
sequences = tokenizer.texts_to_sequences([url_to_classify])
padded_sequence = tf.keras.preprocessing.sequence.pad_sequences(sequences, maxlen=100)

# Faz a predição
prediction = model.predict(padded_sequence, verbose=0)
predicted_index = np.argmax(prediction)
confidence = float(prediction[0][predicted_index]) # Pega a confiança da predição
category = label_names[predicted_index]

# Cria um dicionário com o resultado
result_data = {
    'category': category,
    'confidence': confidence
}

# Imprime o resultado como uma string JSON. O Node.js irá capturar isso.
print(json.dumps(result_data))
