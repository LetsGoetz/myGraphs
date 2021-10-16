import Queue from './queue.js';

class GraphNode {

    constructor(val) {
        this.value = val;
        this.edges = {};
    }

    isAdjacent(vertex) {
        return vertex in this.edges;
    }

    getAdjacents() {
        /*
         return edges if there are any, or null
         */

        for (let property in this.edges) {
            // fastest fay to see if there are any properties - for/in is lazy. we do not need to build an array of keys for this.
            return this.edges;
        }
        return null;
    }
}

export class Graph {

    constructor(edgeDirection = Graph.UNDIRECTED) {
        this.vertices = {};
        this.edgeDirection = edgeDirection;
    }

    // if set to true, vertices will be created automatically when you set an edge with vertices that do not exist
    // if false, this.addEdge will throw an error if an edge points to a non-existing node
    bImplicitNodeCreation = true;

    isConnected = true; // graph is assumed to be connected until proven otherwise by this.inspectGraph
    isBipartite = true; // graph is assumed to be bipartite until proven otherwise by this.inspectGraph

    addVertex(node) {
        // add vertex only if it does not exist, return the vertex anyways
        if (!this.vertices[node]) {
            this.vertices[node] = new GraphNode(val, this);
        }

        return this.vertices[node];
    }

    getVertex(node) {
        return this.vertices[node];
    }

    removeVertex(node) {
        /*
        remove the vertex and all edges pointing to the vertex
        */

        if (this.vertices[node]) {

            delete this.vertices[node];

            //time O(V) + reading and deleting the hash
            for (let vertex in this.vertices) {
                if (vertex.edges[node]) {
                    delete vertex.edges[node];
                }
            }

        } else {
            throw `node ${node} does not exist in this graph`;
        }
    }

    addEdge(source, destination) {

        /*
         if this.bAutomaticNodeCreation === true, create vertices if they do not exist,
         set the edges
         */

        if (this.bImplicitNodeCreation === true) {
            this.addVertex(source);
            this.addVertex(destination);
        }

        if (this.vertices[source] && this.vertices[destination]) {

            this._addEdgetUtil(source, destination);

            if (this.edgeDirection === Graph.UNDIRECTED) {
                this._addEdgetUtil(destination, source);
            }

        } else {
            throw "Please cretate vertices before setting edges.";
        }
        
    }
    #_addEdgetUtil(source, destination) {

        /*
         function utilized by this.addEdge, sets an edge in a given direction. 
         !Danger! No conditions checking what so ever. That is why it is private.
         */

        if (this.vertices[source].edges[destination]) {
            // if edge exists increment it's weight
            this.vertices[source].edges[destination].weight += 1;

        } else {
            // edge does not exist, set weight to 1
            this.vertices[source].edges[end] = { weight: 1 };
        }
    }

    getEdge(source, destination) {
        return this.vertices[source].edges[destination] || null;
    }

    removeEdge(source, destination) {
        /*
        just remove the edge if nodes exist
        */
        this._removeEdgeUtil(source, destination);

        if (this.edgeDirection === Graph.UNDIRECTED) {
            // wenn graph is undirected - remove the edge in the opposite direction
            this._removeEdgeUtil(destination, source);
        }
    }
    #_removeEdgeUtil(source, destination) {

        /*
         function utilized by this.removeEdge, removes an edge in a given direction.
         !Danger! No conditions checking what so ever. That is why it is private.
         */
        if (this.vertices[source] && this.vertices[destination]) {
            if (this.vertices[source].edges[destination]) {
                delete this.vertices[source].edges[destination];
            }
        }
    }


    inspectGraph(algorithm = Graph.prototype.traverseGraph.BFS) {
        /*
         traverse the whole graph (which may be disconnected), and while doing it, set isDisconnected and isBipartite properties
         
         iterate over object properties, start the tree search at the first node, once complete, iterate further and check if current node is visited (O(1)).
         run the algorithm from any unvisited node 

         So we iterate once over every vertex and every edge (during tree traversal), which is about O(V+E) + hash operations, and in order do deal with disconnected graphs, we have to compare every vertex to the visisted set,
         which also v iterations + hash table reads

         The advantage of this solution is that it is lazy. We iterate over the object in place, creating and feeding helper structures progressivlely as we advance, and we can stop at any time if our objetive is achieved.
         Makes it tempting to implement chunking, but it is out of the scope of this assignment
         */

        // pass the visited set by reference, so we do not have to iterate over the values twice in order to get a top-level visited set
        let visited = new Set();

        // key: vertex, value: 1|-1 , where 1 is red and -1 is blue 
        let coloration = new Map();

        let bFirstIteration = true;

        let generator; // generator we'll use depends on the desired algorithm

        if (algorithm === Graph.prototype.traverseGraph.DFS) {
            generator = Graph.dfsGenerator;
        } else if (algorithm === Graph.prototype.traverseGraph.BFS) {
            generator = Graph.bfsGenerator;
        } else {
            throw "Unknown search algorithm. Please store your search algorithm name as a symbolc value in constructor props and integrate it here."
        }

        for (let graphNode in this.vertices) {

            // skip visited certices
            if (visited.has(graphNode)) continue;

            // for/of will trigger our generator which will fill the visited Set and coloration Map while iterating. Next() yields unvisited nodes.
            // omit coloration if not needed
            for (let vertex of generator(graphNode, visited, coloration)) {

                // do something with it here if you like
            }


            // if we are here, and it is not the first iteration, it means we have disjoint subsets in our graph
            if (bFirstIteration) {
                bFirstIteration = false;
            } else {
                this.isConnected = false;
            }
        }
    }


    *bfsGenerator(first, visited, coloration=null) {
        /*
         * first is a vertex, visited is a Set, coloration is a Map Obj
         yield the next node,  upon next() mark it as visited, engueue adjacents
         */

        let nodesToVisit = new Queue();

        nodesToVisit.enqueue(first);

        // if we need to check the coloration: set first node to red
        if (coloration) coloration.set(first, 1);

        while (!nodesToVisit.isEmpty()) {

            let node = nodesToVisit.dequeue();

            if (!visited.has(node)) {
                
                for (let adjacent in node.edges) {

                    if (coloration) {
                        //color all adjacents
                        this._processEdgeBipartition(node, adjacent, coloration);
                    }

                    nodesToVisit.enqueue(adjacent);
                }

                yield node;
                visited.add(node);
            }
        }
    }

    *dfsGenerator(first, visited, coloration = null) {
        /*
         * first is a vertex, visited is a Set, coloration is a Map Obj
          yield the next node, upon next() mark it as visited, push adjacents to the stack
         */
        
        let nodesToVisit = []; //this is our stack

        nodesToVisit.push(first);

        // if we need to check the coloration: set first node to red
        if (coloration) coloration.set(first, 1);

        while (nodesToVisit.length) {
            let node = nodesToVisit.pop();

            if (!visited.has(node)) {

                for (let adjacent in node.edges) {

                    if (coloration) {
                        //color all adjacents
                        this._processEdgeBipartition(node, adjacent, coloration);
                    }

                    nodesToVisit.push(adjacent);
                }

                yield node;
                visited.add(node);
            }
        }
    }
    #_processEdgeBipartition(source, adjacent, coloration) {
        // Utility function for generators 

        if (!coloration.has(adjacent)) {
            // set the opposite color if it is not set
            coloration.set(adjacent, coloration.get(source) * -1);
        } else {
            //if the color of adjacent is set - check for bipartition
            if (coloration.get(source) + coloration.get(adjacent) !== 0) {
                // graph is not biaprtite
                this.isBipartite = false;
            }
        }
    }

}

 
Graph.UNDIRECTED = Symbol('directed graph'); // one-way edges
Graph.DIRECTED = Symbol('undirected graph'); // two-ways edges
Graph.prototype.traverseGraph.DFS = Symbol('DFS'); // use DFS for traversal
Graph.prototype.traverseGraph.DFS = Symbol('BFS'); // use BFS for traversal