import subprocess

def run(cmd):
    subprocess.run(cmd, shell=True)

run("git add .")
run("git commit -m \"Fix Render deployment crash: switch Worker from eventlet to gthread\"")
run("git push")
