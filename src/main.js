const GraphConstructorPromise = import('./structures/graph.js').then(graphModule => graphModule.default);
// use Graph = (async) await GraphConstructorPromise or GraphConstructorPromise.then(Graph => {....})

let currentGraphInstance;

function onClickAction() {
    /* trigger input processing
     */

    processInput();
}

const processInput = async () => {
    /*
     if there is any input, iterate over it and
     */

    let rawString = document.getElementById("input").value.trim();

    //create the graph (it does not inspect it)    
    if (rawString) {
        const Graph = await GraphConstructorPromise;
        currentGraphInstance = new Graph(); // use Graph.DIRECTED as a constructor parameter if graph is directed

        for (let edges of inputIterator(rawString)) {
            edges.forEach(edge => currentGraphInstance.addEdge(...edge));
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
    let message = `The given graph is ${currentGraphInstance.isBipartite? "" : "NOT "}biapratite (red-blue colorable)`;

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

                    for (i = 0; i + 1 < saConnectedVertices.length; i++) {

                        if (!saConnectedVertices[i] || !saConnectedVertices[i + 1]) throw "Bad input: missing vetex.";

                        edges.push([saConnectedVertices[i], saConnectedVertices[i + 1]])
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