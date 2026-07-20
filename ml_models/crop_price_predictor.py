import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# ML Models
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.svm import SVR
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os

class CropPricePredictor:
    def __init__(self, excel_path: str = 'AgriLink_Chikkamagaluru_Crop_Prices.xlsx'):
        self.excel_path = excel_path
        self.crops_data = {}
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        
        # Load and prepare data
        self.load_data()
        self.prepare_features()
        
    def load_data(self):
        """Load crop data from Excel file"""
        try:
            xls = pd.ExcelFile(self.excel_path)
            
            for crop_name in xls.sheet_names:
                df = pd.read_excel(self.excel_path, sheet_name=crop_name)
                # Clean and prepare data
                df['month'] = pd.to_datetime(df['month'])
                df = df.sort_values('month')
                df = df.dropna()
                
                # Store processed data
                self.crops_data[crop_name.lower()] = df
                print(f"Loaded {len(df)} records for {crop_name}")
                
        except Exception as e:
            print(f"Error loading data: {e}")
            
    def prepare_features(self):
        """Create features for ML models"""
        for crop_name, df in self.crops_data.items():
            # Create time-based features
            df = df.copy()
            df['year'] = df['month'].dt.year
            df['month_num'] = df['month'].dt.month
            df['quarter'] = df['month'].dt.quarter
            df['day_of_year'] = df['month'].dt.dayofyear
            
            # Create lag features (previous months' prices)
            for lag in [1, 2, 3, 6, 12]:
                df[f'lag_{lag}'] = df['value'].shift(lag)
            
            # Create rolling statistics
            for window in [3, 6, 12]:
                df[f'rolling_mean_{window}'] = df['value'].shift(1).rolling(window=window).mean()
                df[f'rolling_std_{window}'] = df['value'].shift(1).rolling(window=window).std()
            
            # Create trend features
            df['trend'] = range(len(df))
            df['month_trend'] = df.groupby('month_num').cumcount()
            
            # Remove NaN values created by lag features
            df = df.dropna()
            
            # Store processed data
            self.crops_data[crop_name] = df
            
            # Define feature columns (exclude target and date)
            self.feature_columns = [col for col in df.columns if col not in ['month', 'value']]
            
    def train_models(self, crop_name: str) -> Dict[str, float]:
        """Train multiple ML models for a specific crop"""
        if crop_name not in self.crops_data:
            return {}
            
        df = self.crops_data[crop_name]
        X = df[self.feature_columns]
        y = df['value']
        
        # Split data (80% train, 20% test)
        split_idx = int(len(df) * 0.8)
        X_train, X_test = X[:split_idx], X[split_idx:]
        y_train, y_test = y[:split_idx], y[split_idx:]
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Initialize models
        models = {
            'random_forest': RandomForestRegressor(n_estimators=100, random_state=42),
            'gradient_boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'linear_regression': LinearRegression(),
            'svr': SVR(kernel='rbf', C=100, gamma=0.1)
        }
        
        # Train and evaluate models
        results = {}
        best_model = None
        best_score = float('inf')
        
        for name, model in models.items():
            try:
                # Train model
                if name == 'svr':
                    model.fit(X_train_scaled, y_train)
                    y_pred = model.predict(X_test_scaled)
                else:
                    model.fit(X_train, y_train)
                    y_pred = model.predict(X_test)
                
                # Calculate metrics
                mae = mean_absolute_error(y_test, y_pred)
                rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                r2 = r2_score(y_test, y_pred)
                
                results[name] = {
                    'mae': mae,
                    'rmse': rmse,
                    'r2': r2,
                    'model': model
                }
                
                # Track best model (based on RMSE)
                if rmse < best_score:
                    best_score = rmse
                    best_model = model
                    
                print(f"{crop_name} - {name}: RMSE={rmse:.2f}, R²={r2:.3f}")
                
            except Exception as e:
                print(f"Error training {name} for {crop_name}: {e}")
                
        # Store best model and scaler
        if best_model is not None:
            self.models[crop_name] = best_model
            self.scalers[crop_name] = scaler
            
        return results
        
    def predict_future_prices(self, crop_name: str, months_ahead: int = 3) -> Dict:
        """Predict future prices for a crop"""
        if crop_name not in self.models:
            return {'error': f'Model not trained for {crop_name}'}
            
        try:
            df = self.crops_data[crop_name]
            model = self.models[crop_name]
            scaler = self.scalers[crop_name]
            
            # Get last known data
            last_data = df.iloc[-1].copy()
            predictions = []
            prediction_dates = []
            
            # Predict month by month
            current_data = last_data.copy()
            
            for i in range(1, months_ahead + 1):
                # Create features for prediction
                future_date = last_data['month'] + pd.DateOffset(months=i)
                
                # Update time features
                current_data['year'] = future_date.year
                current_data['month_num'] = future_date.month
                current_data['quarter'] = future_date.quarter
                current_data['day_of_year'] = future_date.dayofyear
                current_data['trend'] = len(df) + i
                
                # Create prediction features
                features = current_data[self.feature_columns].values.reshape(1, -1)
                
                # Scale features for SVR
                if isinstance(model, SVR):
                    features_scaled = scaler.transform(features)
                    prediction = model.predict(features_scaled)[0]
                else:
                    prediction = model.predict(features)[0]
                
                predictions.append(max(0, prediction))  # Ensure non-negative
                prediction_dates.append(future_date)
                
                # Update lag features for next prediction
                current_data['lag_1'] = prediction
                for lag in [2, 3, 6, 12]:
                    if lag <= i:
                        current_data[f'lag_{lag}'] = predictions[-lag]
                        
                # Update rolling features
                recent_values = df['value'].tolist() + predictions
                for window in [3, 6, 12]:
                    if len(recent_values) >= window:
                        current_data[f'rolling_mean_{window}'] = np.mean(recent_values[-window:])
                        current_data[f'rolling_std_{window}'] = np.std(recent_values[-window:])
                        
            return {
                'crop': crop_name,
                'predictions': predictions,
                'dates': [date.strftime('%Y-%m-%d') for date in prediction_dates],
                'confidence_intervals': self._calculate_confidence_intervals(predictions)
            }
            
        except Exception as e:
            return {'error': f'Prediction failed: {str(e)}'}
            
    def _calculate_confidence_intervals(self, predictions: List[float]) -> List[Dict]:
        """Calculate confidence intervals for predictions"""
        intervals = []
        for pred in predictions:
            # Simple confidence interval (±20% for demonstration)
            margin = pred * 0.2
            intervals.append({
                'lower': max(0, pred - margin),
                'upper': pred + margin
            })
        return intervals
        
    def get_historical_data(self, crop_name: str, months: int = 24) -> Dict:
        """Get historical price data for a crop"""
        if crop_name not in self.crops_data:
            return {'error': f'Data not found for {crop_name}'}
            
        df = self.crops_data[crop_name].copy()
        
        # Filter to recent months
        cutoff_date = df['month'].max() - pd.DateOffset(months=months)
        df = df[df['month'] >= cutoff_date]
        
        return {
            'crop': crop_name,
            'dates': df['month'].dt.strftime('%Y-%m-%d').tolist(),
            'prices': df['value'].tolist(),
            'data_points': len(df)
        }
        
    def get_crop_list(self) -> List[str]:
        """Get list of available crops"""
        return list(self.crops_data.keys())
        
    def train_all_models(self):
        """Train models for all crops"""
        print("Training models for all crops...")
        for crop_name in self.crops_data.keys():
            print(f"\nTraining models for {crop_name}...")
            self.train_models(crop_name)
        print("Training complete!")

# Initialize and train models
if __name__ == "__main__":
    predictor = CropPricePredictor()
    predictor.train_all_models()
    
    # Test prediction for a crop
    if 'arecanut' in predictor.models:
        result = predictor.predict_future_prices('arecanut', 3)
        print("Sample prediction for arecanut:")
        print(result)
