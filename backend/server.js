const path = require("path"); //pang pathing lang to
const dotenv = require("dotenv"); //para magamit ung env file natin

dotenv.config({ //pang load ng env file natin
    path: path.join(__dirname, "config", ".env") //path lang ng env file natin
});

const app = require("./app"); //para sa ginawang express app
const { connectDB } = require("./config/db"); //pang connect sa database

const PORT = process.env.PORT || 3000; //pang set ng port number natin ung || para pag wala edi 3000

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Aureo server running on port ${PORT}`);
    });
};

startServer();