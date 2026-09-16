import { Client} from '@elastic/elasticsearch'


export const es = new Client({
  node: 'http://localhost:9200'
})

