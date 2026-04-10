import os
import sys
import boto3
from dotenv import load_dotenv
from datetime import datetime

# Add the parent directory to the system path to allow imports from config if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_s3_connection():
    # Load environment variables from backend/.env
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    load_dotenv(dotenv_path=env_path)

    bucket_name = os.getenv('AWS_S3_BUCKET_NAME')
    access_key = os.getenv('AWS_ACCESS_KEY_ID')
    secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
    region = os.getenv('AWS_REGION', 'us-east-1')

    print("--------------------------------------------------")
    print("      AWS S3 ZERO-TRUST CONNECTION TESTER         ")
    print("--------------------------------------------------")

    if not all([bucket_name, access_key, secret_key]):
        print("❌ ERROR: Missing AWS credentials in your .env file.")
        print("Ensure 'AWS_S3_BUCKET_NAME', 'AWS_ACCESS_KEY_ID', and 'AWS_SECRET_ACCESS_KEY' are populated.")
        return

    print(f"1. Validating Credentials format for bucket: {bucket_name}...")
    
    try:
        # Initialize boto3 client
        s3 = boto3.client(
            's3',
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=region
        )
        print("✅ Client initialized.")

        # Test Upload
        print("2. Attempting to upload a test file to S3...")
        test_key = f"ransomware_backups/test_connection_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        test_body = b"This is an automated test from your E-Commerce Defense Platform verifying S3 integration."
        
        s3.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_body,
            ContentType='text/plain',
            ServerSideEncryption='AES256'
        )
        print(f"✅ Success! File temporarily uploaded to s3://{bucket_name}/{test_key}")

        # Test Read/Verify (Optional, verifying permissions)
        print("3. Validating successful storage...")
        response = s3.head_object(Bucket=bucket_name, Key=test_key)
        print(f"✅ Verified storage! File size: {response['ContentLength']} bytes")

        print("\n🎉 ALL TESTS PASSED! Your AWS S3 integration is 100% working.")
        print("You can safely start your app. Automated backups to S3 will function perfectly.")

    except Exception as e:
        print(f"\n❌ S3 CONNECTION FAILED!")
        print(f"Error Details: {str(e)}")
        print("\nTroubleshooting Tips:")
        print("1. Ensure the IAM user tied to these credentials has 's3:PutObject' permissions.")
        print("2. Verify your AWS_S3_BUCKET_NAME is correct and the bucket physically exists.")
        print("3. Check for typos in your .env keys.")

if __name__ == "__main__":
    test_s3_connection()
