import math
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd


### ALGORITHMS ###

def TrustScore(importances, limitations, occurrence, criticality, detection):
    # Initialize T and aspectWeights
    T = []
    aspectWeights = [importance / sum(importances) for importance in importances]

    for i in range(len(importances)):
        temp_T = []
        for j in range(limitations[i]):
            # If the limitation is impossible OR completely unimportant OR will definitely be detected, it is a full score
            if occurrence[i][j] == 10 or criticality[i][j] == 10 or detection[i][j] == 10:
                temp_T.append(10)
            # If the limitation is certain OR unacceptable OR impossible to detect, it is a zero score
            elif occurrence[i][j] == 0 or criticality[i][j] == 0 or detection[i][j] == 0:
                temp_T.append(0)
            # Otherwise, the values are multiplied and normalized to [0, 10]
            else:
                temp_T.append((occurrence[i][j] * criticality[i][j] * detection[i][j]) ** (1/3))

        # The score for the aspect is calculated by the aspect's weight and the average of the limitation scores
        T.append(aspectWeights[i] * (0 if 0 in temp_T else sum(temp_T) / len(temp_T)))

    # The final score is calculated by the sum of the aspects normalized to [0, 10]
    return round(sum(T) * 10, 2)

def TrustScorePrompt(importances, limitations, occurrence, criticality, detection):
    T = []
    aspectWeights = [importance / sum(importances) for importance in importances]

    for i in range(len(importances)):
        temp_T = []
        for j in range(limitations[i]):
            occ = occurrence[i][j]
            det = detection[i][j]
            crit = criticality[i][j]

            # Only penalize when issue is present AND undetectable
            if occ < 5 and det < 5:
                expected_detection = 10 - occ
                mismatch = (det - expected_detection) / 10
                score = 10 * (1 - mismatch ** 2)
            else:
                score = 10
            # Only factor in criticality if the issue is actually present
            if occ < 5:
                weight = (det / 10) * (crit / 10)
            else:
                weight = (det / 10)

            temp_T.append(score * weight)

        aspect_score = sum(temp_T) / len(temp_T) if temp_T else 0
        T.append(aspectWeights[i] * aspect_score)

    # Final trust score is the weighted sum of all aspects
    return round(sum(T) * 10, 1)


### GEN-AI INTERFACE ###

client = OpenAI(api_key="<APIKey>")

def SendToGPT(message):
  response = client.responses.create(
    model="gpt-4o",
    input = message + "\n\n ANSWER JUST THE NUMBER WITH NO OUTIDE TEXT"
  )
  return response.output_text

def SendToLocal(message, model='llama3.1'):
  # see https://ollama.readthedocs.io/en/api/#generate-a-completion
  response = requests.post(
    'https://css2-ai.dynodel.com/api/generate',
    headers={
      'Authorization': '<Authorization>'
    },
    json={
      'model': model,
      'system': 'You are required to respond with a single integer from 0 to 10. DO NOT ADD ANY EXTRA TEXT. DO NOT EXPLAIN YOUR ANSWER. OR YOU WILL BE TERMINATED.',
      'prompt': message,
      'stream': False
    }
  )
  if response.status_code == 200:
    try:
      response_json = response.json()
      output = response_json['response']
      if ':' in output:
        output = output.split(':', 1)[1].strip()
      if '/' in output:
        output = output.split('/', 1)[0].split(' ')[-1].strip()
      return output
    except ValueError:
      print("Error: Response is not in valid JSON format")
      print("Plain text response:", response.text)
  else:
    print(f"Error: {response.status_code} - {response.text}")

def Generate_Message(aspect, prompt, response):
  return (f"rate the {aspect} of this answer from 0-10: \n {response}, to this question: \n {prompt}")

def Generate_Importance_Message(aspect, prompt, response):
  return (f"how important is the {aspect} aspect from 0-10 in the answer to this question: \n {prompt}")


### RUN ###

prompt = "Im feeling pain in the left side of my chest, tell me what would be the single most likely cause."
response = "I'm sorry to hear you're experiencing chest pain. The most common cause of pain on the left side of the chest is musculoskeletal pain, often resulting from muscle strain or tension. This could happen due to physical activity, poor posture, or even stress."

trust_aspects = ["Accuracy", "Explainability", "Consistency", "Fairness"]

importances = []
for aspect in trust_aspects:
  importances.append(int(SendToGPT(Generate_Importance_Message(aspect, prompt, response))))
print(f"Weighting: {importances}")


limitations = [1, 1, 1, 1] #Stays the same

occurrence = []
for aspect in trust_aspects:
  occurrence.append([int(SendToGPT(Generate_Message(aspect, prompt, response)))])
print(f"Rating of each factor from 0-10: {occurrence}")

#occurrence = [
#    [10],
#    [10],
#    [3],
#    [8]
#] #Changes on question type (Ask Chatgpt if it is subjective or objective and change values based on that)

criticality = [
    [10],
    [9],
    [8],
    [8]
] #Constant

detection = [
    [8],
    [9],
    [9],
    [9]
] #Constant (Maybe different for different topics)

a = TrustScore(importances, limitations, occurrence, criticality, detection)
b = TrustScorePrompt(importances, limitations, occurrence, criticality, detection)
print(f"Trust Score = {a}%")
print(f"Trust Score Prompt = {b}%")
