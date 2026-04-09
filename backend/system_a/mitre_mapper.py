from datetime import datetime

class MitreMapper:
    """
    Maps detected threats and blocks to the classical MITRE ATT&CK Framework
    Generates compliance and security posture reports based on incidents.
    """
    def __init__(self, db):
        self.db = db
        
        # MITRE ATT&CK Knowledge Base Mapping
        self.mitre_matrix = {
            'AI_ML_Scraping_Block': {
                'tactic': 'Reconnaissance (TA0043)',
                'technique_id': 'T1595.002',
                'technique_name': 'Active Scanning: Vulnerability Scanning',
                'description': 'Attacker rapidly mapped or scraped the API endpoints.'
            },
            'AI_ML_DoS_Block': {
                'tactic': 'Impact (TA0040)',
                'technique_id': 'T1498.001',
                'technique_name': 'Network Denial of Service: Direct Network Flood',
                'description': 'Attacker attempted to overwhelm the application layer.'
            },
            'canary_access': {
                'tactic': 'Exfiltration (TA0010)',
                'technique_id': 'T1005',
                'technique_name': 'Data from Local System',
                'description': 'Attacker exported user database triggering Honey-Canaries.'
            },
            'honeytoken_breach': {
                'tactic': 'Credential Access (TA0006)',
                'technique_id': 'T1078',
                'technique_name': 'Valid Accounts (Deception Trap)',
                'description': 'Attacker attempted to use poisoned credentials/API keys.'
            },
            'ransomware_simulation': {
                'tactic': 'Impact (TA0040)',
                'technique_id': 'T1485',
                'technique_name': 'Data Destruction',
                'description': 'Database wiped/corrupted, triggering Secure Enclave Restore.'
            }
        }
        
    def map_event_to_mitre(self, reason: str, source: str) -> dict:
        """Map a raw threat reason string to MITRE categories"""
        reason_lower = reason.lower()
        
        if 'canary' in reason_lower:
            return self.mitre_matrix['canary_access']
        elif 'honeytoken' in reason_lower:
            return self.mitre_matrix['honeytoken_breach']
        elif 'scrap' in reason_lower or 'scan' in reason_lower or 'diversity' in reason_lower:
            return self.mitre_matrix['AI_ML_Scraping_Block']
        elif 'critical' in reason_lower or 'high' in reason_lower or risk_score_implied_dos(reason_lower):
            return self.mitre_matrix['AI_ML_DoS_Block']
            
        # Default fallback
        return {
            'tactic': 'Discovery (TA0007)',
            'technique_id': 'T1046',
            'technique_name': 'Network Service Discovery',
            'description': 'Uncategorized anomalous network activity.'
        }
        
    def generate_report(self) -> dict:
        """Generate a full MITRE ATT&CK alignment report mapping all recorded threats"""
        blocked_ips = list(self.db.blocked_ips.find({}, {'_id': 0}))
        blockchain_threats = list(self.db.blockchain_blocks.find({'data.type': {'$exists': True}}, {'_id': 0}).sort('index', -1).limit(50))
        
        mapped_incidents = []
        
        # Parse blocks
        for block in blocked_ips:
            reason = block.get('reason', 'Unknown ML Block')
            mitre_data = self.map_event_to_mitre(reason, source='system_a')
            
            # Extract correct time from both System A (blocked_at) and System B (timestamp)
            event_time = block.get('timestamp') or block.get('blocked_at') or datetime.now()
            if hasattr(event_time, 'isoformat'):
                event_time = event_time.isoformat()
            else:
                event_time = str(event_time)
                
            mapped_incidents.append({
                'event_timestamp': event_time,
                'ip_address': block.get('ip'),
                'framework_mapping': mitre_data,
                'raw_reason': reason
            })
            
        report = {
            'report_generated_at': datetime.now().isoformat(),
            'total_incidents_analyzed': len(blocked_ips),
            'mapped_incidents': mapped_incidents,
            'defensive_posture': {
                'TA0043_Reconnaissance_Defense': 'Active (ML Agentic Tracking)',
                'TA0010_Exfiltration_Defense': 'Active (Fernet Encryption & Differential Privacy)',
                'TA0006_Credential_Defense': 'Active (Dynamic Honeytokens)',
                'TA0040_Impact_Defense': 'Active (Offline Backup Enclave)'
            }
        }
        
        return report

def risk_score_implied_dos(reason_str):
    return 'score:' in reason_str or 'critical threat' in reason_str
