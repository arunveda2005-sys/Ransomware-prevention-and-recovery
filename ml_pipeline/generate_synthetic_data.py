"""
Synthetic HTTP Security Dataset Generator
Creates realistic training data for e-commerce threat detection
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

np.random.seed(42)
random.seed(42)

def generate_normal_traffic(n_samples=500):
    """Generate normal user behavior patterns"""
    data = []
    
    for _ in range(n_samples):
        # Normal shopping behavior
        session_duration = np.random.uniform(5, 30)  # 5-30 minutes
        num_requests = int(np.random.uniform(5, 50))  # 5-50 requests per session
        
        record = {
            # Request patterns
            'request_rate': np.random.uniform(0.5, 3.0),  # 0.5-3 requests/sec (human speed)
            'unique_endpoints': int(np.random.uniform(3, 15)),  # Browsing different pages
            'endpoint_diversity': np.random.uniform(0.6, 0.95),  # High variety
            'repeat_request_ratio': np.random.uniform(0.05, 0.3),  # Low repetition
            'failed_request_ratio': np.random.uniform(0.0, 0.1),  # Few errors
            'post_get_ratio': np.random.uniform(0.1, 0.3),  # Mostly GET requests
            
            # Session behavior
            'session_duration_min': session_duration,
            'total_requests': num_requests,
            'avg_time_between_requests': np.random.uniform(3, 10),  # Human timing
            'request_time_variance': np.random.uniform(2, 8),  # Irregular timing
            'requests_per_minute': num_requests / session_duration,
            
            # Data access
            'total_data_transferred_mb': np.random.uniform(0.5, 5),  # Normal browsing
            'avg_response_size_kb': np.random.uniform(10, 100),
            'sensitive_endpoint_access': 0,  # No admin access
            'bulk_query_indicator': 0,  # No bulk exports
            'sequential_id_access': 0,  # Not scraping IDs
            
            # Client indicators
            'known_browser': 1,  # Chrome, Firefox, Safari
            'user_agent_changes': 0,  # Consistent UA
            'missing_headers': 0,  # All headers present
            'has_referer': 1,  # Normal navigation
            'javascript_enabled': 1,  # Real browser
            
            # Time patterns
            'night_activity': int(np.random.random() < 0.1),  # 10% night users
            'weekend_activity': int(np.random.random() < 0.3),  # 30% weekend
            'off_hours_ratio': np.random.uniform(0, 0.2),
            
            # Attack indicators
            'sql_injection_patterns': 0,
            'xss_patterns': 0,
            'path_traversal_patterns': 0,
            'authentication_failures': 0,
            'canary_access_count': 0,
            
            # Label
            'label': 'NORMAL'
        }
        data.append(record)
    
    return data


def generate_rapid_scraping(n_samples=150):
    """Generate web scraping attack patterns"""
    data = []
    
    for _ in range(n_samples):
        session_duration = np.random.uniform(1, 5)  # Short sessions
        num_requests = int(np.random.uniform(50, 200))  # Many requests
        
        record = {
            # Request patterns - KEY INDICATORS
            'request_rate': np.random.uniform(10, 50),  # 🚨 Very high rate
            'unique_endpoints': int(np.random.uniform(1, 3)),  # Same endpoint
            'endpoint_diversity': np.random.uniform(0.05, 0.2),  # 🚨 Very low
            'repeat_request_ratio': np.random.uniform(0.8, 0.99),  # 🚨 High repetition
            'failed_request_ratio': np.random.uniform(0, 0.2),
            'post_get_ratio': np.random.uniform(0, 0.1),  # Mostly GET
            
            # Session behavior
            'session_duration_min': session_duration,
            'total_requests': num_requests,
            'avg_time_between_requests': np.random.uniform(0.02, 0.5),  # 🚨 Bot speed
            'request_time_variance': np.random.uniform(0, 1),  # 🚨 Very regular
            'requests_per_minute': num_requests / session_duration,
            
            # Data access
            'total_data_transferred_mb': np.random.uniform(5, 50),
            'avg_response_size_kb': np.random.uniform(20, 150),
            'sensitive_endpoint_access': 0,
            'bulk_query_indicator': int(np.random.random() < 0.3),
            'sequential_id_access': 1,  # 🚨 Scraping product IDs
            
            # Client indicators
            'known_browser': int(np.random.random() < 0.3),  # 🚨 Often unknown
            'user_agent_changes': 0,
            'missing_headers': int(np.random.random() < 0.5),  # 🚨 Bot-like
            'has_referer': int(np.random.random() < 0.5),
            'javascript_enabled': int(np.random.random() < 0.4),  # Headless
            
            # Time patterns
            'night_activity': int(np.random.random() < 0.4),
            'weekend_activity': int(np.random.random() < 0.5),
            'off_hours_ratio': np.random.uniform(0.2, 0.8),
            
            # Attack indicators
            'sql_injection_patterns': 0,
            'xss_patterns': 0,
            'path_traversal_patterns': 0,
            'authentication_failures': 0,
            'canary_access_count': 0,
            
            'label': 'RAPID_SCRAPING'
        }
        data.append(record)
    
    return data


def generate_data_exfiltration(n_samples=100):
    """Generate data exfiltration attack patterns"""
    data = []
    
    for _ in range(n_samples):
        session_duration = np.random.uniform(2, 10)
        num_requests = int(np.random.uniform(10, 50))
        
        record = {
            # Request patterns
            'request_rate': np.random.uniform(1, 5),
            'unique_endpoints': int(np.random.uniform(2, 8)),
            'endpoint_diversity': np.random.uniform(0.3, 0.7),
            'repeat_request_ratio': np.random.uniform(0.2, 0.5),
            'failed_request_ratio': np.random.uniform(0, 0.15),
            'post_get_ratio': np.random.uniform(0.1, 0.4),
            
            # Session behavior
            'session_duration_min': session_duration,
            'total_requests': num_requests,
            'avg_time_between_requests': np.random.uniform(2, 8),
            'request_time_variance': np.random.uniform(1, 5),
            'requests_per_minute': num_requests / session_duration,
            
            # Data access - KEY INDICATORS
            'total_data_transferred_mb': np.random.uniform(10, 100),  # 🚨 Large download
            'avg_response_size_kb': np.random.uniform(500, 5000),  # 🚨 Big responses
            'sensitive_endpoint_access': 1,  # 🚨 /admin/users/export
            'bulk_query_indicator': 1,  # 🚨 Export all data
            'sequential_id_access': 0,
            
            # Client indicators
            'known_browser': int(np.random.random() < 0.6),
            'user_agent_changes': 0,
            'missing_headers': int(np.random.random() < 0.3),
            'has_referer': 1,
            'javascript_enabled': 1,
            
            # Time patterns - Often off-hours
            'night_activity': int(np.random.random() < 0.7),  # 🚨 Often at night
            'weekend_activity': int(np.random.random() < 0.6),
            'off_hours_ratio': np.random.uniform(0.4, 0.9),
            
            # Attack indicators
            'sql_injection_patterns': 0,
            'xss_patterns': 0,
            'path_traversal_patterns': 0,
            'authentication_failures': int(np.random.uniform(0, 3)),
            'canary_access_count': int(np.random.uniform(1, 5)),  # 🚨 Accessed fake data
            
            'label': 'DATA_EXFILTRATION'
        }
        data.append(record)
    
    return data


def generate_credential_stuffing(n_samples=100):
    """Generate credential stuffing attack patterns"""
    data = []
    
    for _ in range(n_samples):
        session_duration = np.random.uniform(1, 10)
        num_requests = int(np.random.uniform(20, 200))
        
        record = {
            # Request patterns
            'request_rate': np.random.uniform(5, 20),  # 🚨 Fast login attempts
            'unique_endpoints': 1,  # Only /auth/login
            'endpoint_diversity': 0.05,  # 🚨 Same endpoint
            'repeat_request_ratio': 0.95,  # 🚨 All same
            'failed_request_ratio': np.random.uniform(0.7, 0.99),  # 🚨 Most fail
            'post_get_ratio': 1.0,  # All POST
            
            # Session behavior
            'session_duration_min': session_duration,
            'total_requests': num_requests,
            'avg_time_between_requests': np.random.uniform(0.1, 1),  # Fast
            'request_time_variance': np.random.uniform(0, 0.5),  # Regular
            'requests_per_minute': num_requests / session_duration,
            
            # Data access
            'total_data_transferred_mb': np.random.uniform(0.1, 2),
            'avg_response_size_kb': np.random.uniform(1, 10),
            'sensitive_endpoint_access': 0,
            'bulk_query_indicator': 0,
            'sequential_id_access': 0,
            
            # Client indicators
            'known_browser': int(np.random.random() < 0.2),  # 🚨 Bot
            'user_agent_changes': int(np.random.random() < 0.2),
            'missing_headers': int(np.random.random() < 0.7),  # 🚨 Missing headers
            'has_referer': int(np.random.random() < 0.3),
            'javascript_enabled': int(np.random.random() < 0.3),
            
            # Time patterns
            'night_activity': int(np.random.random() < 0.5),
            'weekend_activity': int(np.random.random() < 0.5),
            'off_hours_ratio': np.random.uniform(0.2, 0.7),
            
            # Attack indicators
            'sql_injection_patterns': 0,
            'xss_patterns': 0,
            'path_traversal_patterns': 0,
            'authentication_failures': int(np.random.uniform(10, 100)),  # 🚨 Many failures
            'canary_access_count': 0,
            
            'label': 'CREDENTIAL_STUFFING'
        }
        data.append(record)
    
    return data


def generate_sql_injection(n_samples=80):
    """Generate SQL injection attack patterns"""
    data = []
    
    for _ in range(n_samples):
        session_duration = np.random.uniform(1, 5)
        num_requests = int(np.random.uniform(5, 30))
        
        record = {
            # Request patterns
            'request_rate': np.random.uniform(1, 8),
            'unique_endpoints': int(np.random.uniform(2, 10)),
            'endpoint_diversity': np.random.uniform(0.3, 0.7),
            'repeat_request_ratio': np.random.uniform(0.3, 0.7),
            'failed_request_ratio': np.random.uniform(0.5, 0.95),  # 🚨 Many errors
            'post_get_ratio': np.random.uniform(0.3, 0.7),
            
            # Session behavior
            'session_duration_min': session_duration,
            'total_requests': num_requests,
            'avg_time_between_requests': np.random.uniform(1, 5),
            'request_time_variance': np.random.uniform(1, 4),
            'requests_per_minute': num_requests / session_duration,
            
            # Data access
            'total_data_transferred_mb': np.random.uniform(0.5, 10),
            'avg_response_size_kb': np.random.uniform(5, 100),
            'sensitive_endpoint_access': int(np.random.random() < 0.3),
            'bulk_query_indicator': 0,
            'sequential_id_access': 0,
            
            # Client indicators
            'known_browser': int(np.random.random() < 0.5),
            'user_agent_changes': 0,
            'missing_headers': int(np.random.random() < 0.5),
            'has_referer': int(np.random.random() < 0.6),
            'javascript_enabled': int(np.random.random() < 0.7),
            
            # Time patterns
            'night_activity': int(np.random.random() < 0.4),
            'weekend_activity': int(np.random.random() < 0.4),
            'off_hours_ratio': np.random.uniform(0.1, 0.6),
            
            # Attack indicators
            'sql_injection_patterns': 1,  # 🚨 SQL patterns detected
            'xss_patterns': int(np.random.random() < 0.2),
            'path_traversal_patterns': int(np.random.random() < 0.2),
            'authentication_failures': int(np.random.uniform(0, 5)),
            'canary_access_count': 0,
            
            'label': 'SQL_INJECTION'
        }
        data.append(record)
    
    return data


def main():
    print("🔧 Generating synthetic e-commerce security dataset...")
    
    # Generate data for each category
    normal = generate_normal_traffic(500)
    scraping = generate_rapid_scraping(150)
    exfiltration = generate_data_exfiltration(100)
    credential = generate_credential_stuffing(100)
    sql = generate_sql_injection(80)
    
    # Combine all data
    all_data = normal + scraping + exfiltration + credential + sql
    
    # Create DataFrame
    df = pd.DataFrame(all_data)
    
    # Shuffle the data
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)
    
    # Save to CSV
    output_file = 'synthetic_ecommerce_security_data.csv'
    df.to_csv(output_file, index=False)
    
    print(f"\n✅ Dataset created: {output_file}")
    print(f"\n📊 Dataset Statistics:")
    print(df['label'].value_counts())
    print(f"\nTotal samples: {len(df)}")
    print(f"Features: {len(df.columns) - 1}")  # Exclude label column
    print(f"\n🎯 Feature columns:")
    for i, col in enumerate(df.columns[:-1], 1):
        print(f"  {i}. {col}")
    
    # Show sample data
    print(f"\n📝 Sample data (first 3 rows):")
    print(df.head(3).to_string())
    
    print(f"\n✅ Ready to train! Use: python train_http_models.py")


if __name__ == "__main__":
    main()
