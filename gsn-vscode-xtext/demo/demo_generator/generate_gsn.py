#!/usr/bin/env python
import random
import numpy as np
import uuid
import sys

if len(sys.argv)==4:
    filename = sys.argv[3]
    average_branching_factor = float(sys.argv[1])
    node_cnt = int(sys.argv[2])
else:
    filename = "generated_tree.gsn"
    average_branching_factor = 10.0
    node_cnt = 10000

print("""
Usage: python generate_gsn.py avg_branching_factor node_count filename

average branching factor: %0.2f
node count: %d
filename: %s

""" %(average_branching_factor, node_cnt, filename))


gsn_tree= [["namespace_gsn", "G"]]
parents = gsn_tree
depth = 1
while len(sum(gsn_tree, [])) < node_cnt:
    children = []
    for parent in (row[1] for row in parents):                    
        for x in range(int(random.gauss(mu=average_branching_factor, sigma=1.0))):            
            if len(sum(gsn_tree, [])) < node_cnt:
                node = [parent, str(parent)+"_"+str(x)]
                children.append(node)                    
                gsn_tree.append(node)
                print("Generating node #%d of %d" %(len(sum(gsn_tree, [])), node_cnt))
            else:
                break
        if len(sum(gsn_tree, [])) >= node_cnt:
            break
    parents = children
    depth+=1   


print("node count "+str(len(sum(gsn_tree, []))))
# print("depth "+str(depth))


parents =  np.array(list(row[0] for row in gsn_tree))
nodes = np.array(list(row[1] for row in gsn_tree))

namespace = parents[0]
root = nodes[0]




def get_tabs(level):
    tabs=""
    for i in range(level):
        tabs+="\t"
    return tabs

def get_child_nodes(node, parents, nodes, f, level):
    if len(np.where(parents==node))>0:
        ret = ""
        for node in nodes[np.where(parents==node)]:
            ret+=(get_tabs(level)+"goal "+str(node)+"{\n"+get_tabs(level+1)+"uuid: \""+str(uuid.uuid4())+"\";\n")
            # print("Collecting node #%s" %node)
            ret+=get_child_nodes(node, parents, nodes, f, level=level+1)            
            ret+=(get_tabs(level)+"}\n")                            
    else:        
        ret=("\t}")
    return ret

f = open(filename, "w")
gsn="""GOALS %s{
    goal %s{
        uuid: "%s";
""" % (namespace, root, uuid.uuid4())
f.write(gsn)
f.close()

f = open(filename, "a")
gsn = get_child_nodes(root, parents, nodes, f, level=2)
gsn += "\t}\n}\n"

print("gsn file is being saved to: "+str(filename))
f.write(gsn)
f.close()

