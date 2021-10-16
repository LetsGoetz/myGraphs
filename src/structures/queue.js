class QueueNode {
    constructor(value) {
        this.value = value
        this.next = null
    }
}

export class Queue {
    /*
    implements linked list structure
    */

    constructor() {
        this.first = null
        this.last = null
        this.size = 0
    }

    isEmpty() {
        return !this.size
    }

    enqueue(item) {
        /*
        enqueue a new item, increase the size of the queue, return the queue
        */

        // Create node
        let newNode = new QueueNode(item)
        
        // If list is empty, first and last item will point to the new node
        if (this.isEmpty()) {
            this.first = newNode
            this.last = newNode
        } else {

            // assign the link
            this.last.next = newNode

            // "push" new node
            this.last = newNode
        }

        this.size++

        return this
    }


    dequeue() {
        /*
         return the first element (or null if the queue is empty), assign the next node to this.first 
         */

        if (this.isEmpty()) return null

        let itemToBeRemoved = this.first

        if (this.first === this.last) {

            // If first and last node are pointing the same item, last node is dequeued
            this.last = null
        }

        this.first = this.first.next

        this.size--

        return itemToBeRemoved
    }


    peek() {
        /*
        return the next element to be dequeued
        */
        return this.first
    }
}