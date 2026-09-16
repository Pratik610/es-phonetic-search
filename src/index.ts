import { es } from "./elastic-search.js";
import users from "./utils/users.js";



async function compare(name: string) {
    const soundex: any = await es.indices.analyze({
        index: "users",
        analyzer: "soundex_analyzer",
        text: name,
    });

    const nysiis: any = await es.indices.analyze({
        index: "users",
        analyzer: "nysiis_analyzer",
        text: name,
    });

    console.log({
        name,
        soundex: soundex?.tokens.map((t: any) => t.token),
        nysiis: nysiis?.tokens.map((t: any) => t.token),
    });
}

const search = async (name: string) => {
    const result = await es.search({
        index: "users",
        query: {
            bool: {
                should: [
                    {
                        match: {
                            name: {
                                query: name,
                                boost: 3,
                                fuzziness: "AUTO",
                            },
                        },
                    },
                    {
                        match: {
                            "name.soundex": {
                                query: name,
                                boost: 2,
                                fuzziness: "AUTO",
                            },
                        },
                    },
                    {
                        match: {
                            "name.nysiis": {
                                query: name,
                                boost: 2,
                                fuzziness: "AUTO",
                            },
                        },
                    },
                ],
            },
        },
    });

    console.log(result.hits.hits);
}


const deleteIndex = async (indexName: string) => {
    const indexExists = await es.indices.exists({ index: indexName });

    if (indexExists) {
        await es.indices.delete({ index: indexName });
        console.log(`Index ${indexName} deleted.`);
    } else {
        console.log(`Index ${indexName} does not exist.`);
    }
}

const addUsers = async () => {

    for (const user of users) {
        await es.index({
            index: "users",
            document: {
                name: user,
                email: `${user.toLowerCase()}@gmail.com`,
                age: Math.floor(Math.random() * 50) + 20,
                city: "Pune",
            },
        });
    }
    console.log("Users added to the index.");
}



const main = async () => {
    const indexName = 'users';

    // Check if the index exists
    const indexExists = await es.indices.exists({ index: indexName });

    if (!indexExists) {
        // Create the index with phonetic analyzer settings



        await es.indices.create({
            index: "users",

            settings: {
                analysis: {
                    filter: {
                        name_phonetic: {
                            type: "phonetic",
                            encoder: "double_metaphone",
                            replace: false,
                        },
                        name_nysiis: {
                            type: "phonetic",
                            encoder: "nysiis",
                            replace: false,
                        },
                        name_soundex: {
                            type: "phonetic",
                            encoder: "soundex",
                            replace: false,
                        },

                    },

                    analyzer: {
                        name_analyzer: {
                            type: "custom",
                            tokenizer: "standard",
                            filter: [
                                "lowercase",
                                "name_phonetic",
                            ],
                        },
                        soundex_analyzer: {
                            type: "custom",
                            tokenizer: "standard",
                            filter: [
                                "lowercase",
                                "name_soundex",
                            ],
                        },
                        nysiis_analyzer: {
                            type: "custom",
                            tokenizer: "standard",
                            filter: [
                                "lowercase",
                                "name_nysiis",
                            ],
                        },
                    },
                },
            },

            mappings: {
                properties: {
                    name: {
                        type: "text",

                        fields: {
                            phonetic: {
                                type: "text",
                                analyzer: "name_analyzer",
                            },
                            soundex: {
                                type: "text",
                                analyzer: "soundex_analyzer",
                            },

                            nysiis: {
                                type: "text",
                                analyzer: "nysiis_analyzer",
                            },
                        },
                    },

                    email: {
                        type: "keyword",
                    },

                    age: {
                        type: "integer",
                    },

                    city: {
                        type: "keyword",
                    },
                },
            },
        });

    }
    


    addUsers().catch(console.error);
    search("smiith");

    // compare("Smith");
    // compare("Smyth");
    // compare("Smit");
    // compare("Smythe");
}

deleteIndex("users").catch(console.error);
main().catch(console.error);
