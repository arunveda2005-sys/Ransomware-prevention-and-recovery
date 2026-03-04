import subprocess

def run(cmd):
    print(f"Executing: {cmd}")
    process = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if process.stdout:
        print(process.stdout)
    if process.stderr:
        print(process.stderr)

run("git add .")
run("git commit -m \"Final deployment prep: Syncing all recent UI fixes and backend enhancements\"")
run("git push")
