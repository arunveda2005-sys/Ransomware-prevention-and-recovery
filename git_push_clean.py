import subprocess

def run(cmd):
    subprocess.run(cmd, shell=True)

run("git add .")
run("git commit -m \"Clean up temp files\"")
run("git push")
