import { json, type RequestHandler } from "@sveltejs/kit";
import { Ollama } from "ollama";

export const POST: RequestHandler = async ({ request }) => {
  const ollama = new Ollama({ host: "http://localhost:11434/" });

  const dataOfUser = {
    name: "Marlyn M. Gregorio",
    nickname: "Malen",
    age: "20",
    birthday: "September 6, 2004",
    nationality: "Filipino",
    religion: "Catholic",
    school: "Gordon College",
    course: "Bachelor of Science in Computer Science",
    ingameName: "Marzette",
    hobbies: ["Playing gacha games", "Reading manga and webtoons"],
    zodiacSign: "Virgo",
    favoriteColors: ["Purple", "Red", "Blue"],
    favoriteFoods: ["Giniling", "Carbonara", "Pusit"],
    favoriteGames: ["Honkai Star Rail", "Toram Online"],
    favoriteCharacter: "Erza Scarlet",
    dreamDestinations: ["Japan", "Paris", "Italy"]
  };

  try {
    const { message } = await request.json()
    
    const chat = await ollama.chat({
      model: "deepseek-r1:latest",
      messages: [
        {
          role: "system",
          content: `Hi, I'm Marlyn. Here is my data: ${JSON.stringify(dataOfUser)} 
                        Respond only based on the data of the master user.`,
        },
        { role: "user", content: message },
      ],
    })
    
    return json({ response: chat.message.content })
  } catch (error) {
    console.error("Ollama API Error:", error)
    return json({ error: "Failed to fetch response from Ollama." }, { status: 500 })
  }
}