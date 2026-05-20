import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
const typeDefs = `#graphql
    type Book {
        id: ID!
        title: String!
        publishedYear: Int
        author: Author!
    }
    type Author {
        id: ID!
        name: String!
        b_year: Int
        books: [Book!]!
    }
    type Query {
        books: [Book!]!           # получить все книги
        book(id: ID!): Book       # получить книгу по id
        authors: [Author!]!       # получить всех авторов
    }
    type Mutation {
        createBook(
            title: String!
            publishedYear: Int
            authorId: ID!
        ) : Book!

        createAuthor(
            name: String!
            birthYear: Int
        ) : Author!
    }
`;

const books = [
    {id: '1', title: 'Война и мир', publishedYear: 1869, authorId: '1'},
    {id: '2', title: 'Анна Каренина', publishedYear: 1877, authorId: '1'},
    {id: '3', title: 'Преступление и наказание', publishedYear: 1866, authorId: '2'}
];

const authors= [
    {id: '1', name: 'Лев Толстой', b_year: 1828},
    {id: '2', name: 'Федр Достоевский', b_year: 1821}
];

const resolvers = {
    Book: {
        author(parent){
            return authors.find(author => author.id === parent.authorId);
        },
    },

    Author: {
        books(parent){
            return books.filter(book => book.authorId === parent.id);
        },
    },
    
    Query: {
        books: () => books,
        book: (_,{ id }) => books.find(book => book.id === id),
        authors : () => authors,
    },

    Mutation: {
        createBook: (_, {title, publishedYear, authorId}) =>{
            const author_exists = authors.some(author => author.id === authorId);
            if (!author_exists){
                throw new Error(`Author with ${authorId} id not found`);
            }
            const newBook = {
                id: String(books.length + 1),
                title,
                publishedYear: publishedYear || null,
                authorId,
            };
            books.push(newBook);
            return newBook;
        },

        createAuthor: (_, {name, birthYear}) => {
            const newAuthor ={
                id: String(authors.length + 1),
                name,
                birthYear: birthYear || null,
            };
            authors.push(newAuthor);
            return newAuthor;
        },
    },
};

const server = new ApolloServer({typeDefs, resolvers});
const {url} = await startStandaloneServer(server, {
    listen: {port: 4000},  
});

console.log(`GraphQL Server ready at: ${url}`);