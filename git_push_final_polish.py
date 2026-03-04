import subprocess

def run(cmd):
    subprocess.run(cmd, shell=True)

run("git add .")
run("git commit -m \"Final Polish: Visualized Breach Detection, Stolen Data Preview, and System Deep Reset\"")
run("git push")
