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

        while (nodesToVisit.isEmpty ? !nodesToVisit.isEmpty() : nodesToVisit.length) {

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

                if (visited.get(graphNode) != iTraversalCount) {
                    // assert visited.get(graphNode) != iTraversalCount, which means the graph is connected to an other subset
                    isConnectedToOtherSubset = true;
                }
            }
        }

        // set the graph properties
        if (graph.isConnected !== false) graph.isConnected = isConnectedToOtherSubset;
        if (coloration) graph.isBipartite = (graph.isBipartite !== false && graph.isConnected === true);
    }

    // union find----------------------------------START


    findRepresentatives() {

        let parents = {};
        let ranks = {};
        let representatives = new Set();


        for (let vertexName in this.vertices) {
            parents[vertexName] = vertexName;
            ranks[vertexName] = 1;
        }

        

        for (let vertexName in this.vertices) {

            //find representative of the current set
            let currentSetRepresentative = vertexName;
            while (parents[currentSetRepresentative] != currentSetRepresentative) {
                currentSetRepresentative = parents[currentSetRepresentative];
            }

            // now vertexName is the represent. name

            for (let adjName in this.vertices[vertexName].edges) {

                if (parents[adjName] == adjName) {
                    //adjacent is a set on its own - consume it!

                    parents[adjName] = currentSetRepresentative;
                    ranks[currentSetRepresentative]++;
                    ranks[adjName]--;

                    representatives.add(currentSetRepresentative);

                } else {
                    // adj is a member of a set already

                    let adjReprName = adjName;

                    //find its representative
                    while (parents[adjReprName] != adjReprName) {
                        adjReprName = parents[adjReprName];
                    }

                    let winner, looser;

                    if (adjReprName == currentSetRepresentative) {
                        // adj && vertex have same root

                        parents[adjName] = currentSetRepresentative;

                    } else if (ranks[adjReprName] > ranks[currentSetRepresentative]) {

                        winner = adjReprName;
                        looser = currentSetRepresentative;

                    } else {
                        // assert ranks[adjReprName] <= ranks[vertexName] && adjReprName != vertexName
                        winner = currentSetRepresentative;
                        looser = adjReprName;
                    }

                    ranks[winner] = ranks[winner] + ranks[looser];
                    ranks[looser] = 0;

                    representatives.delete(looser);
                    parents[looser] = winner;
                }

            }
        }

        return representatives;
    }
    // union find----------------------------------END

    // detect cycles DFS ----------------------------START

    isCyclic() {

        let visited = new Set();
        let currentPath = new Set();

        for (let nodeName in this.vertices) {
            if (this.iscyclicUtil(this.vertices[nodeName], visited, currentPath)) return true;
        }

        return false;
    }

    iscyclicUtil(vertex, visited, currentPath, predecessor = null) {

        if (currentPath.has(vertex)) return true;

        if (visited.has(vertex)) return false;

        visited.add(vertex);
        currentPath.add(vertex);

        for (let adjName in vertex.edges) {
            if (this.edgeDirection == Graph.UNDIRECTED && predecessor && vertex.edges[adjName].target == predecessor) continue;

            if (this.iscyclicUtil(vertex.edges[adjName].target, visited, currentPath, vertex)) return true;
        }

        currentPath.delete(vertex);

        return false;
    }

    // detect cycles DFS ----------------------------END

    // find shortest path ----------------------------------START

    findShortestPath(startNode, targetNode) {

        let distances = this.calcualateDistances(startNode);
        let pathStack = [];
        let vertex = targetNode;

        if (!distances.has(vertex)) return null;
        pathStack.push(vertex);

        do {
            vertex = distances.get(vertex).pred;
            pathStack.push(vertex);

        } while (vertex != startNode);

        return this.reverseArray(pathStack);
    }

    calcualateDistances(startNode) {

        let distances = new Map();
        let nodesToVisit = new Queue;

        nodesToVisit.enqueue(startNode);
        distances.set(startNode, { pred: null, distance: 0 });

        while (!nodesToVisit.isEmpty()) {
            let vertex = nodesToVisit.dequeue().value;

            for (let adjName in vertex.edges) {
                let adj = vertex.edges[adjName].target;

                nodesToVisit.enqueue(adj);

                let currentAdjDistance = distances.get(vertex).distance + vertex.edges[adjName].weight;

                if (!distances.has(adj) || distances.get(adj) > currentAdjDistance) {
                    distances.set(adj, { pred: vertex, distance: currentAdjDistance })
                }
            }
        }

        return distances;
    }

    // find shortest path ----------------------------------END

    // find ANY path ----------------------------------START

    findPath(startNode, targetNode) {

        let visited = new Set();
        let pathStack = [];

        return this.reverseArray(this.findPathUtil(startNode, targetNode, visited, pathStack));
    }

    findPathUtil(vertex, targetNode, visited, pathStack) {

        if (vertex == targetNode) {
            pathStack.push(vertex);
            return pathStack;
        }

        visited.add(vertex);

        let result;

        for (let adjName in vertex.edges) {
            let adj = vertex.edges[adjName].target;

            result = this.findPathUtil(adj, targetNode, visited, pathStack);

            if (result) {
                pathStack.push(vertex);
                return pathStack;
            }
        }
    }

    // find ANY path ----------------------------------END
    //find mother vertex ---------------------------START

    findMotherVertex() {

        if (this.edgeDirection == Graph.UNDIRECTED) return  "Any vertex is a mother vertex in an undirected graph."

        let visited = new Set();

        let lastRootNode;

        let verticesCount = 0;
        for (let nodeName in this.vertices) {
            verticesCount++;

            if (!visited.has(this.vertices[nodeName])) {
                this.findMothervertexUtil(this.vertices[nodeName], visited);
                lastRootNode = this.vertices[nodeName];
            }
        }

        return this.checkMotherVertexIntegrity(lastRootNode, verticesCount) ? lastRootNode : "No mother vertex exists in this graph"
    }

    findMothervertexUtil(vertex, visited) {
        visited.add(vertex);

        for (let adjName in vertex.edges) {
            if (!visited.has(vertex.edges[adjName].target)) {
                this.findMothervertexUtil(vertex.edges[adjName].target, visited);
            }
        }
    }

    checkMotherVertexIntegrity(vertex, verticesCount) {

        let visited = new Set();

        this.findMothervertexUtil(vertex, visited);

        return visited.size === verticesCount;
    }
    //find mother vertex ---------------------------END

    // topologicSort ----------------------------START

    topologicSort() {
        if (this.edgeDirection == Graph.UNDIRECTED) throw "graph is undirected";

        let visited = new Set();
        let sortingStack = [];

        for (let nodeName in this.vertices) {
            if (!visited.has(this.vertices[nodeName])) {
                this.topologicsortUtil(this.vertices[nodeName], visited, sortingStack);
            }
        }

        return this.reverseArray(sortingStack);
    }

    topologicsortUtil(vertex, visited, sortingStack) {

        visited.add(vertex);

        for (let adjName in vertex.edges) {
            let adjacent = vertex.edges[adjName].target;

            if (!visited.has(adjacent)) {
                this.topologicsortUtil(adjacent, visited, sortingStack);
            }
        }

        sortingStack.push(vertex);
    }

    // topologicSort ----------------------------END

    // helpers ----------------------------------
    reverseArray(arr) {

        if (!arr) return null;

        let N = arr.length;

        for (let i = 0; i < Math.floor(N / 2); i++) {
            let tmp = arr[i];

            arr[i] = arr[N - i - 1];
            arr[N - i - 1] = tmp;
        }

        return arr;
    }

}

 
Graph.UNDIRECTED = Symbol('undirected graph'); // one-way edges
Graph.DIRECTED = Symbol('directed graph'); // two-ways edges
Graph.prototype.inspectGraph.DFS = Symbol('DFS'); // use DFS for traversal
Graph.prototype.inspectGraph.BFS = Symbol('BFS'); // use BFS for traversal