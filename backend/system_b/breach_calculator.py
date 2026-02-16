from datetime import datetime
from typing import Dict, List

class BreachImpactCalculator:
    """
    Calculate financial and regulatory impact of data breaches
    Based on GDPR and real breach data patterns
    """
    
    def __init__(self, db_connection):
        self.db = db_connection
        
        # GDPR fine structure
        self.gdpr_base_fine = 20_000_000  # €20M or 4% revenue
        
        # Per-record fine estimates
        self.per_record_fines = {
            'CRITICAL': 150,  # Credit cards, SSN, passwords
            'SENSITIVE': 50,   # Email, phone, address
            'LOW': 5           # Name, city
        }
        
        # Notification thresholds
        self.notification_threshold = 500  # GDPR Article 33
    
    def classify_accessed_data(self, accessed_records: Dict[str, List[str]]) -> Dict:
        """Classify accessed data by sensitivity"""
        classification = {
            'CRITICAL': 0,
            'SENSITIVE': 0,
            'LOW': 0,
            'total': 0
        }
        
        # Analyze each collection
        for collection_name, record_ids in accessed_records.items():
            collection = self.db[collection_name]
            
            for record_id in record_ids:
                try:
                    doc = collection.find_one({'_id': record_id})
                    
                    if not doc:
                        continue
                    
                    # Count sensitive fields
                    for field, value in doc.items():
                        if field == '_id' or not value:
                            continue
                        
                        # Determine sensitivity
                        if any(keyword in field.lower() for keyword in ['password', 'ssn', 'credit_card']):
                            classification['CRITICAL'] += 1
                        elif any(keyword in field.lower() for keyword in ['email', 'phone', 'address']):
                            classification['SENSITIVE'] += 1
                        else:
                            classification['LOW'] += 1
                    
                    classification['total'] += 1
                except:
                    continue
        
        return classification
    
    def calculate_financial_impact(self, data_classification: Dict) -> Dict:
        """Calculate estimated fines"""
        # Calculate based on per-record fines
        expected_fine = (
            data_classification['CRITICAL'] * self.per_record_fines['CRITICAL'] +
            data_classification['SENSITIVE'] * self.per_record_fines['SENSITIVE'] +
            data_classification['LOW'] * self.per_record_fines['LOW']
        )
        
        # GDPR can be up to €20M or 4% annual revenue
        minimum_fine = int(expected_fine * 0.5)
        maximum_fine = min(int(expected_fine * 2.0), self.gdpr_base_fine)
        
        return {
            'minimum_fine': minimum_fine,
            'maximum_fine': maximum_fine,
            'expected_fine': expected_fine,
            'currency': 'USD'
        }
    
    def assess_regulatory_risk(self, data_classification: Dict) -> str:
        """Determine regulatory risk level"""
        if data_classification['CRITICAL'] > 100:
            return 'CRITICAL'
        elif data_classification['CRITICAL'] > 0 or data_classification['SENSITIVE'] > 1000:
            return 'HIGH'
        elif data_classification['SENSITIVE'] > 100:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def calculate_full_impact(self, accessed_records: Dict[str, List[str]]) -> Dict:
        """Complete breach impact assessment"""
        # Classify data
        classification = self.classify_accessed_data(accessed_records)
        
        # Calculate financial impact
        financial = self.calculate_financial_impact(classification)
        
        # Assess regulatory risk
        regulatory_risk = self.assess_regulatory_risk(classification)
        
        # Determine notification requirement
        notification_required = classification['total'] >= self.notification_threshold
        
        # Generate report
        report = {
            'timestamp': datetime.now().isoformat(),
            'breach_summary': {
                'total_records': classification['total'],
                'critical_records': classification['CRITICAL'],
                'sensitive_records': classification['SENSITIVE'],
                'low_sensitivity_records': classification['LOW']
            },
            'financial_impact': financial,
            'regulatory_risk': regulatory_risk,
            'notification_required': notification_required,
            'affected_collections': list(accessed_records.keys()),
            'recommendations': self._generate_recommendations(regulatory_risk, classification)
        }
        
        # Store report in database
        self.db.breach_reports.insert_one(report)
        
        return report
    
    def _generate_recommendations(self, risk_level: str, classification: Dict) -> List[str]:
        """Generate action recommendations"""
        recommendations = []
        
        if risk_level in ['CRITICAL', 'HIGH']:
            recommendations.append('Immediately notify Data Protection Officer')
            recommendations.append('Prepare breach notification within 72 hours (GDPR Article 33)')
            recommendations.append('Consider engaging legal counsel')
            recommendations.append('Activate incident response plan')
        
        if classification['CRITICAL'] > 0:
            recommendations.append('Force password resets for affected users')
            recommendations.append('Monitor for fraudulent transactions')
            recommendations.append('Offer credit monitoring services')
        
        if classification['SENSITIVE'] > 100:
            recommendations.append('Send breach notification to affected users')
            recommendations.append('Enable enhanced account monitoring')
        
        recommendations.append('Review and update security controls')
        recommendations.append('Conduct post-breach security audit')
        
        return recommendations
