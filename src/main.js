const GraphConstructorPromise = import('./structures/graph.js').then(graphModule => graphModule.default);
// use Graph = (async) await GraphConstructorPromise or GraphConstructorPromise.then(Graph => {....})

let currentGraphInstance;

function onClickAction() {
    /* trigger input processing
     */

    processInput();
}

function onClickTopo() {
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("topologic sort", currentGraphInstance.topologicSort());
}

function onClickMother(){
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("findMotherVertex: ", currentGraphInstance.findMotherVertex());
}

function onClickAnyPath() {
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("find any path between 'a' and 'z': ", currentGraphInstance.findPath(currentGraphInstance.vertices["a"], currentGraphInstance.vertices["z"]));
}

function onClickShortestPath() {
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("find shortest path between 'a' and 'z': ", currentGraphInstance.findShortestPath(currentGraphInstance.vertices["a"], currentGraphInstance.vertices["z"]));
}

function onClickIsCyclic() {
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("Is this graph cyclic?: ", currentGraphInstance.isCyclic());
}

function onClickRepresentatives() {
    if (!currentGraphInstance) throw "please create the graph first";
    console.log("find representatives of connected subsets: ", currentGraphInstance.findRepresentatives());
}

const processInput = async () => {
    /*
     if there is any input, iterate over it and
     */

    let rawString = document.getElementById("input").value.trim();

    //create the graph (it does not inspect it)    
    if (rawString) {
        const Graph = await GraphConstructorPromise;
        currentGraphInstance = new Graph(Graph.DIRECTED); // use Graph.DIRECTED as a constructor parameter if graph is directed

        for (let edges of inputIterator(rawString)) {
            edges.forEach(edge => {
                if (edge.length === 1) {
                    currentGraphInstance.addVertex(...edge);
                } else if (edge.length === 2) {
                    currentGraphInstance.addEdge(...edge)
                } else {
                    throw "Unexpected edge length"
                }
            });
        }
    }

    // inspect the graph   
    // default algorithm is BFS, call this function with parameter Graph.prototype.inspectGraph.DFS for DFS
    currentGraphInstance.inspectGraph(); 

    console.log(currentGraphInstance);

    displayInspectionResults();
}

function displayInspectionResults() {
    let messageDisplay = document.getElementById("messageDisplay");
    let message = "The given graph is: <br>";

    if (currentGraphInstance.edgeDirection === currentGraphInstance.constructor.UNDIRECTED) {
        message += `undirected, `;
    } else {
        message += `directed, `;
    }

    if (currentGraphInstance.isConnected === false) {
        message += `disconnected, which also means not bipartite (red - blue colorable)`;
    } else {
        message += `connected ${ currentGraphInstance.isBipartite ? "and " : "but NOT " }biapratite (red - blue colorable)`;
    }

    messageDisplay.innerHTML = message;
}


function inputIterator(sValue) {
    /* 
    is called by for/of, spread and Array.from.
    iterate over subsets and return an array of edges for each subset
    */

    // Match a comma or end
    let separatorReg = /,|\n|$/g;

    // Start matching at first pos
    separatorReg.lastIndex = sValue.match(/[^]/).index;

    // Return an iterable iterator object
    return {

        // make this iterable 
        [Symbol.iterator]() {
            return this;
        },

        // make this an iterator
        next() {
            // Resume where the last match ended
            let start = separatorReg.lastIndex;

            if (start < sValue.length) {
                // If we're not done

                // Match the next separator
                let match = separatorReg.exec(sValue);

                // If we found one, return the value if it is a number or skip it
                if (match) {

                    let sPart = sValue.substring(start, match.index).replace(/\s*/g, '');

                    let saConnectedVertices = sPart.split('-'); 

                    let edges = [];

                    if (saConnectedVertices.length == 1) {
                        // solo vertex
                        edges.push([saConnectedVertices[0]]);
                    } else {
                        for (i = 0; i + 1 < saConnectedVertices.length; i++) {

                            if (!saConnectedVertices[i] || !saConnectedVertices[i + 1]) throw "Bad input: missing vetex.";

                            edges.push([saConnectedVertices[i], saConnectedVertices[i + 1]])
                        }
                    }

                    if (edges.length) return { value: edges };

                    return this.next();
                }
            }

            // Otherwise we're done
            return { done: true };
        }
    };
}