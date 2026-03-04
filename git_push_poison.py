import subprocess

def run(cmd):
    subprocess.run(cmd, shell=True)

run("git add .")
run("git commit -m \"Add Breach Countermeasures (Poisoning) visualization to Admin Dashboard\"")
run("git push")
