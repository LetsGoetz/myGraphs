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
        // add vertex only if it does not exist, return the vertex anyway
        if (!this.vertices[node] && node) {
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

            if (this.edgeDirection === Graph.DIRECTED) {
                //iterate over every vertex
                for (let vertex in this.vertices) {
                    if (vertex.edges[node]) {
                        delete vertex.edges[node];
                    }
                }
            } else {
                //just iterate over edges
                for (let edge in this.vertices[node].edges) {
                    
                    if (this.vertices[edge].edges[node]) delete this.vertices[edge].edges[node];
                }
            }

            delete this.vertices[node];

        } else {
            throw `node ${node} does not exist in this graph`;
        }
    }

    addEdge(source, destination) {

        /*
         if this.bAutomaticNodeCreation === true, create vertices if they do not exist,
         set the edges
         */

        if (!(source && destination)) throw "Setting edges is only possible if source and destination nodes are given"

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
         
         iterate over object properties, start the tree search at the first node, once complete, iterate further and check if current node is visited.
         run the algorithm from any unvisited node 

         */

        let visited = new Map();

        // key: vertex, value: boolean, where true is "red" and false is "blue" 
        let coloration = new Map();

        let iTraversalCount = 0;

        // !! Do not interrupt the iteration prematurely for graph to have isConnected, isBipartite && isCyclic properties set correctly !!
        for (let graphNodeName in this.vertices) {

            let graphNode = this.vertices[graphNodeName];

            // skip visited certices
            if (visited.has(graphNode)) continue;
            iTraversalCount++;

            // trigger our generator which will fill the visited Set and coloration Map while iterating. next() yields unvisited graphNodes.
            for (let vertex of this.graphTraversalGenerator(graphNode, visited, iTraversalCount, this, algorithm, coloration)) {

                // do something with the graphNode object here if you like

            }
        }
    }

    *graphTraversalGenerator(first, visited, iTraversalCount, graph, algorithm, coloration = null) {
        /*
         * first is a graphNode object, visited is a Map Obj, coloration is a Map Obj
         yield the next graphNode,  upon next() mark it as visited, engueue adjacents
         */

        let nodesToVisit;

        // the only implementation difference between DFS and BFS here is the stack/queue
        if (algorithm === Graph.prototype.inspectGraph.DFS) {
            nodesToVisit = []; //this is our stack
            nodesToVisit.push(first);
        } else if (algorithm === Graph.prototype.inspectGraph.BFS) {
            nodesToVisit = new Queue();
            nodesToVisit.enqueue(first);
        } else {
            throw "Unknown search algorithm. Please store your search algorithm name as a symbolc value in constructor props and integrate it here."
        }

        //check the connectivity
        let isConnectedToOtherSubset = iTraversalCount === 1;

        // if we need to check the coloration: set first node to red
        if (coloration) coloration.set(first.value, true);

        while (!nodesToVisit.isEmpty()) {

            let graphNode;
            
            if (algorithm === Graph.prototype.inspectGraph.DFS) {
                graphNode = nodesToVisit.pop();
            } else {
                graphNode = nodesToVisit.dequeue().value;
            }


            if (!visited.has(graphNode)) {

                for (let adjacentName in graphNode.edges) {

                    if (coloration) {
                        //color all adjacents

                        if (!coloration.has(adjacentName)) {
                            // set the opposite color if it is not set
                            coloration.set(adjacentName, !coloration.get(graphNode.value));
                        } else {
                            //if the color of adjacent is set - check for bipartition
                            if (coloration.get(graphNode.value) === coloration.get(adjacentName)) {
                                // graph is not biaprtite
                                graph.isBipartite = false;

                            }
                        }
                    }

                    if (algorithm === Graph.prototype.inspectGraph.DFS) {
                        nodesToVisit.push(graphNode.edges[adjacentName].target);
                    } else {
                        nodesToVisit.enqueue(graphNode.edges[adjacentName].target);
                    } 
                }

                yield graphNode;
                visited.set(graphNode, iTraversalCount);

            } else if (graph.edgeDirection == Graph.DIRECTED) {

                if (visited.get(graphNode) == iTraversalCount) {
                    // the node was visited during this traversal -> is cyclic
                    graph.isCyclic = true;

                } else {
                    // assert visited.get(graphNode) != iTraversalCount, which means the graph is connected to an other subset
                    isConnectedToOtherSubset = true;
                }
            }
        }

        // set the graph properties
        if (graph.isConnected !== false) graph.isConnected = isConnectedToOtherSubset;
        if (coloration) graph.isBipartite = (graph.isBipartite !== false && graph.isConnected === true);
        graph.isCyclic = graph.edgeDirection === Graph.UNDIRECTED || graph.isCyclic === true;
    }

}

 
Graph.UNDIRECTED = Symbol('undirected graph'); // one-way edges
Graph.DIRECTED = Symbol('directed graph'); // two-ways edges
Graph.prototype.inspectGraph.DFS = Symbol('DFS'); // use DFS for traversal
Graph.prototype.inspectGraph.BFS = Symbol('BFS'); // use BFS for traversal