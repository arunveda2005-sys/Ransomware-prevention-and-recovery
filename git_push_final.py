import subprocess

def run(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(f"[{cmd}] Returns: {result.returncode}")
    if result.stdout:
        print(f"STDOUT:\n{result.stdout}")
    if result.stderr:
        print(f"STDERR:\n{result.stderr}")

run("git status")
run("git add .")
run("git commit -m \"Ensure all strict IP ban changes are pushed\"")
run("git push")
