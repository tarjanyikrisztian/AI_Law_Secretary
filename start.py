import os

#open server folder and run 'flask run' then open the client folder and run 'npm run dev'
os.system('start cmd /k "cd Server && flask run"')
os.system('start cmd /k "cd Client && npm run dev"')

#wait for the server to start
import time
time.sleep(15)

#open the browser and go to the localhost

os.system('start firefox http://localhost:5137/')
