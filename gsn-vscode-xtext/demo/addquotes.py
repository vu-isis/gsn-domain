import sys
import os

'''
This code is used to convert models to add quotes to info and summary attributes. 
Copy this code to the folder containing the .gsn files and run it without any arugments.
Usage: python addquotes.py
'''

import glob

def update(line, val):
    pos= line.find(val)
    length = len(val)
    if (pos != -1):
        before = line[:pos]
        after = line[pos+length:].strip()
        line = before
        line += val +" \'\'\'"
        line += after[:-1]+ "\'\'\';\n"
    return line
        
def readfile(file):
    file1 = open(file, 'r')
    Lines = file1.readlines()

    out = []
    for line in Lines:
        line = update(line, 'info:')
        line = update(line, 'summary:')
        out.append(line)
    
    file1 = open(file,'w')
    file1.write(''.join(out))
            
    

for file in glob.glob("*.gsn"):
    print(file)
    readfile(file)



