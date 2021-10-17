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

export default class Graph {

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
            this.vertices[node] = new GraphNode(node, this);
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

            this.#_addEdgetUtil(source, destination);

            if (this.edgeDirection === Graph.UNDIRECTED) {
                this.#_addEdgetUtil(destination, source);
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
            // edge does not exist, set weight to 1 and the destination target
            this.vertices[source].edges[destination] = { weight: 1, target: this.vertices[destination] };
        }
    }

    getEdge(source, destination) {
        return this.vertices[source].edges[destination] || null;
    }

    removeEdge(source, destination) {
        /*
        just remove the edge if nodes exist
        */
        this.#_removeEdgeUtil(source, destination);

        if (this.edgeDirection === Graph.UNDIRECTED) {
            // wenn graph is undirected - remove the edge in the opposite direction
            this.#_removeEdgeUtil(destination, source);
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


    inspectGraph(algorithm = Graph.prototype.inspectGraph.BFS) {
        /*
         traverse the whole graph (which may be disconnected), and while doing it, set isDisconnected and isBipartite properties
         
         iterate over object properties, start the tree search at the first node, once complete, iterate further and check if current node is visited (O(1)).
         run the algorithm from any unvisited node 

         */

        // pass the visited set by reference, so we do not have to iterate over the values twice in order to get a top-level visited set
        let visited = new Set();

        // key = vertex, value = 1|-1 , where 1 is "red" and -1 is "blue" 
        let coloration = new Map();

        let bFirstIteration = true;

        let generator; // generator we'll use depends on the desired algorithm

        if (algorithm === Graph.prototype.inspectGraph.DFS) {
            generator = this.dfsGenerator;
        } else if (algorithm === Graph.prototype.inspectGraph.BFS) {
            generator = this.bfsGenerator;
        } else {
            throw "Unknown search algorithm. Please store your search algorithm name as a symbolc value in constructor props and integrate it here."
        }

        for (let graphNodeName in this.vertices) {

            let graphNode = this.vertices[graphNodeName];

            // skip visited certices
            if (visited.has(graphNode)) continue;

            // trigger our generator which will fill the visited Set and coloration Map while iterating. Next() yields unvisited graphNodes.
            // omit coloration if not needed. 
            // if coloration is not omitted, and graph coloration is not bipartite, the return value of generator will be { isBipartite: false }
            for (let vertex of generator(graphNode, visited, coloration)) {

                // do something with the graphNode object here if you like

                if (vertex.isBipartite === false) {
                    this.isBipartite = false;
                    return;
                }
            }

            // if we are here, and it is not the first iteration, it means we have disjoint subsets in our graph
            if (bFirstIteration === true) {
                bFirstIteration = false;
            } else {

                console.log("second interation")
                this.isConnected = false;
                this.isBipartite = false;
                return;
            }
        }

    }

    *bfsGenerator(first, visited, coloration=null) {
        /*
         * first is a graphNode object, visited is a Set, coloration is a Map Obj
         yield the next graphNode,  upon next() mark it as visited, engueue adjacents
         */

        let nodesToVisit = new Queue();

        nodesToVisit.enqueue(first);

        // if we need to check the coloration: set first node to red
        if (coloration) coloration.set(first.value, 1);

        while (!nodesToVisit.isEmpty()) {

            let queueNode = nodesToVisit.dequeue();

            let graphNode = queueNode.value; 

            if (!visited.has(graphNode)) {

                for (let adjacentName in graphNode.edges) {

                    if (coloration) {
                        //color all adjacents
                        //this.#_processEdgeBipartition(node, adjacent, coloration);

                        if (!coloration.has(adjacentName)) {
                            // set the opposite color if it is not set
                            coloration.set(adjacentName, (coloration.get(graphNode.value) * -1));
                        } else {
                            //if the color of adjacent is set - check for bipartition
                            if (coloration.get(graphNode.value) + coloration.get(adjacentName) !== 0) {
                                // graph is not biaprtite
                                yield { isBipartite: false }

                            }
                        }
                    }

                    nodesToVisit.enqueue(graphNode.edges[adjacentName].target);
                }

                yield graphNode;
                visited.add(graphNode);
            }
        }
    }

    *dfsGenerator(first, visited, coloration = null) {
        /*
         * first is a graphNode object, visited is a Set, coloration is a Map Obj
          yield the next graphNode, upon next() mark it as visited, push adjacents to the stack
         */

        let nodesToVisit = []; //this is our stack

        nodesToVisit.push(first);

        // if we need to check the coloration: set first node to red
        if (coloration) coloration.set(first.value, 1);

        while (nodesToVisit.length) {
            let graphNode = nodesToVisit.pop();

            if (!visited.has(graphNode)) {

                for (let adjacentName in graphNode.edges) {

                    if (coloration) {
                        //color all adjacents
                        //this.#_processEdgeBipartition(node, adjacent, coloration);

                        if (!coloration.has(adjacentName)) {
                            // set the opposite color if it is not set
                            coloration.set(adjacentName, (coloration.get(graphNode.value) * -1));
                        } else {
                            //if the color of adjacent is set - check for bipartition
                            if (coloration.get(graphNode.value) + coloration.get(adjacentName) !== 0) {
                                // graph is not biaprtite
                                yield { isBipartite: false }

                            }
                        }
                    }

                    nodesToVisit.push(graphNode.edges[adjacentName].target);
                }

                yield graphNode;
                visited.add(graphNode);
            }
        }
    }

}

 
Graph.UNDIRECTED = Symbol('directed graph'); // one-way edges
Graph.DIRECTED = Symbol('undirected graph'); // two-ways edges
Graph.prototype.inspectGraph.DFS = Symbol('DFS'); // use DFS for traversal
Graph.prototype.inspectGraph.BFS = Symbol('BFS'); // use BFS for traversal