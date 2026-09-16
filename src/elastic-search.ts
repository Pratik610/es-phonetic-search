import { Client} from '@elastic/elasticsearch'


export const es = new Client({
  node: 'http://localhost:9200'
})


// for multiple nodes, you can use the following configuration

// const es = new Client({
//   nodes: [
//     "http://localhost:9200",
//     "http://localhost:9201",
//     "http://localhost:9202",
//   ],
// });

