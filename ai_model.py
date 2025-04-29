import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier

class AIModel:
    def __init__(self):
        self.kmeans = KMeans(n_clusters=3, random_state=42)
        self.rf = RandomForestClassifier(random_state=42)
        self.trained = False

    def train(self, data: pd.DataFrame, labels: pd.Series):
        # Train clustering model
        self.kmeans.fit(data)
        # Train classification model
        self.rf.fit(data, labels)
        self.trained = True

    def predict_cluster(self, data: pd.DataFrame):
        if not self.trained:
            raise Exception("Model not trained")
        return self.kmeans.predict(data)

    def predict_alert(self, data: pd.DataFrame):
        if not self.trained:
            raise Exception("Model not trained")
        return self.rf.predict(data)
