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
import sys

# Override print to redirect output to stderr so Node.js can parse clean JSON from stdout
def print(*args, **kwargs):
    kwargs['file'] = sys.stderr
    import builtins
    builtins.print(*args, **kwargs)

class CropPricePredictor:
    def __init__(self, excel_path: str = 'AgriLink_Chikkamagaluru_Crop_Prices_Augmented.xlsx'):
        self.excel_path = excel_path
        self.crops_data = {}
        self.models = {}
        self.scalers = {}
        self.feature_columns = []
        self.saved_models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'saved_models')
        os.makedirs(self.saved_models_dir, exist_ok=True)
        
        # Load and prepare data
        self.load_data()
        self.prepare_features()
        self.load_all_saved_models()
        
    def load_saved_model(self, crop_name: str) -> bool:
        """Load pre-trained model and scaler from joblib files if they exist"""
        model_path = os.path.join(self.saved_models_dir, f"{crop_name}_best_model.pkl")
        scaler_path = os.path.join(self.saved_models_dir, f"{crop_name}_scaler.pkl")
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            try:
                self.models[crop_name] = joblib.load(model_path)
                self.scalers[crop_name] = joblib.load(scaler_path)
                print(f"Loaded saved model and scaler for {crop_name}")
                return True
            except Exception as e:
                print(f"Error loading saved model for {crop_name}: {e}")
        return False

    def load_all_saved_models(self):
        """Attempt to load saved models for all crops"""
        for crop in self.crops_data.keys():
            self.load_saved_model(crop)
        
    def load_data(self):
        """Load crop data from Excel file"""
        try:
            xls = pd.ExcelFile(self.excel_path)
            
            for crop_name in xls.sheet_names:
                if 'readme' in crop_name.lower():
                    continue
                df = pd.read_excel(self.excel_path, sheet_name=crop_name)
                # Clean and prepare data
                if 'month' not in df.columns:
                    continue
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
            
            # Define feature columns (only numeric, exclude target)
            self.feature_columns = [col for col in df.select_dtypes(include=[np.number]).columns if col not in ['value']]
            
    def train_models(self, crop_name: str) -> Dict[str, float]:
        """Train multiple ML models with Hyperparameter Tuning for a specific crop"""
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
        
        # Define hyperparameter grid for tuning
        rf_grid = [{'n_estimators': n, 'max_depth': d, 'random_state': 42} for n in [50, 100] for d in [10, None]]
        gb_grid = [{'n_estimators': 100, 'learning_rate': lr, 'max_depth': md, 'random_state': 42} for lr in [0.05, 0.1] for md in [3, 5]]
        svr_grid = [{'kernel': 'rbf', 'C': c, 'gamma': g} for c in [10, 100] for g in [0.05, 0.1]]
        lr_grid = [{}]
        
        grids = {
            'random_forest': (RandomForestRegressor, rf_grid, False),
            'gradient_boosting': (GradientBoostingRegressor, gb_grid, False),
            'linear_regression': (LinearRegression, lr_grid, False),
            'svr': (SVR, svr_grid, True)
        }
        
        results = {}
        best_model = None
        best_model_name = ""
        best_score = float('inf')
        best_metrics = {}
        
        for name, (model_class, param_grid, use_scaled) in grids.items():
            best_param_rmse = float('inf')
            best_param_model = None
            best_param_metrics = {}
            
            for params in param_grid:
                try:
                    model = model_class(**params)
                    if use_scaled:
                        model.fit(X_train_scaled, y_train)
                        y_pred = model.predict(X_test_scaled)
                    else:
                        model.fit(X_train, y_train)
                        y_pred = model.predict(X_test)
                        
                    mae = mean_absolute_error(y_test, y_pred)
                    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
                    r2 = r2_score(y_test, y_pred)
                    
                    if rmse < best_param_rmse:
                        best_param_rmse = rmse
                        best_param_model = model
                        best_param_metrics = {
                            'mae': float(mae),
                            'rmse': float(rmse),
                            'r2': float(r2),
                            'params': {k: (v if not isinstance(v, type(None)) else 'None') for k, v in params.items()}
                        }
                except Exception as e:
                    print(f"Error training {name} with params {params}: {e}")
            
            if best_param_model is not None:
                results[name] = best_param_metrics
                print(f"{crop_name} - {name} (Best Params: {best_param_metrics['params']}): RMSE={best_param_rmse:.2f}, R²={best_param_metrics['r2']:.3f}")
                
                # Check if this is the overall best model across all types
                if best_param_rmse < best_score:
                    best_score = best_param_rmse
                    best_model = best_param_model
                    best_model_name = name
                    best_metrics = best_param_metrics
                    
        # Store best model and scaler
        if best_model is not None:
            self.models[crop_name] = best_model
            self.scalers[crop_name] = scaler
            
            # Save model to disk
            model_path = os.path.join(self.saved_models_dir, f"{crop_name}_best_model.pkl")
            scaler_path = os.path.join(self.saved_models_dir, f"{crop_name}_scaler.pkl")
            metrics_path = os.path.join(self.saved_models_dir, f"{crop_name}_metrics.json")
            
            try:
                joblib.dump(best_model, model_path)
                joblib.dump(scaler, scaler_path)
                
                # Save metrics to JSON file
                import json
                save_data = {
                    'crop': crop_name,
                    'model_type': best_model_name,
                    'mae': best_metrics['mae'],
                    'rmse': best_metrics['rmse'],
                    'r2': best_metrics['r2'],
                    'params': best_metrics['params'],
                    'trained_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }
                with open(metrics_path, 'w') as f:
                    json.dump(save_data, f, indent=4)
                    
                print(f"Persisted model, scaler, and metrics for {crop_name} to disk.")
            except Exception as e:
                print(f"Error persisting model for {crop_name}: {e}")
                
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
                        
            # Load metrics from JSON if exists
            metrics = {}
            metrics_path = os.path.join(self.saved_models_dir, f"{crop_name}_metrics.json")
            if os.path.exists(metrics_path):
                try:
                    import json
                    with open(metrics_path, 'r') as f:
                        metrics = json.load(f)
                except Exception:
                    pass

            last_known_price = float(df.iloc[-1]['value'])
            final_pred_price = float(predictions[-1])
            change_pct = ((final_pred_price - last_known_price) / last_known_price) * 100
            
            # Volatility classification based on Coefficient of Variation (std / mean)
            coef_var = float(df['value'].std() / df['value'].mean())
            if coef_var >= 0.25:
                volatility = "High"
            elif coef_var >= 0.12:
                volatility = "Medium"
            else:
                volatility = "Low"
                
            if change_pct >= 5.0:
                recommendation = "HOLD"
                rec_text = f"{crop_name.title()} prices are projected to rise by {change_pct:.1f}% over the next {months_ahead} months. Recommendation: HOLD stock to maximize profit."
            elif change_pct <= -5.0:
                recommendation = "SELL"
                rec_text = f"{crop_name.title()} prices are projected to drop by {abs(change_pct):.1f}% over the next {months_ahead} months. Recommendation: SELL stock soon to prevent losses."
            else:
                recommendation = "STABLE"
                rec_text = f"Market prices for {crop_name} are expected to remain stable (change within {change_pct:+.1f}%). Recommendation: Monitor market conditions."

            return {
                'crop': crop_name,
                'predictions': predictions,
                'dates': [date.strftime('%Y-%m-%d') for date in prediction_dates],
                'confidenceIntervals': self._calculate_confidence_intervals(predictions),
                'metrics': metrics,
                'analysis': {
                    'lastKnownPrice': last_known_price,
                    'changePercent': change_pct,
                    'volatility': volatility,
                    'recommendation': recommendation,
                    'recommendationText': rec_text
                }
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
