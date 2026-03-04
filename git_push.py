import subprocess

def run(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stdout:
        print(f"STDOUT: {result.stdout}")
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    print(f"Return Code: {result.returncode}\n")

run("git remote add origin https://github.com/arunveda2005-sys/Ransomware-prevention-and-recovery.git")
run("git branch -M main")
run("git add .")
run("git commit -m \"Apply agentic system fixes and deploy config\"")
run("git push -u origin main")
