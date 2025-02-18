import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import Groq from "groq-sdk";
import YouTubePlayer from "./components/YouTubePlayer";
import axios from "axios";

function App() {
  const groq = new Groq({ apiKey: process.env.REACT_APP_API_KEY_GROQ, dangerouslyAllowBrowser: true });
  
  
  async function getRecommendations(question) {
    const chatCompletion = await getGroqChatCompletion(question);
    // Convert the string response into an array by splitting on commas and trim whitespace
    const movieList = chatCompletion.choices[0]?.message?.content.split(',').map(movie => movie.trim());
    console.log(movieList);

    const moviesWithEdits = await Promise.all(
      movieList.map(async (movie) => {
        const videoId = await searchYoutube(movie);
        return {
          title: movie,
          videoId: videoId,
        };
      })
    );
    
    setRecommendations(moviesWithEdits);
  }

  async function searchYoutube(movieTitle) {
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          key: process.env.REACT_APP_API_KEY_YT,
          q: `${movieTitle} edits`,
          part: "snippet",
          maxResults: 1,
          type: "video",
        },
      });
      return response.data.items[0]?.id?.videoId || null;
    } catch (error) {
      console.error("Error fetching YouTube data:", error);
      return null;
    }
  }
  
  const [inputMovie, setInputMovie] = useState("");
  const [recommendations, setRecommendations] = useState([]);

  async function getGroqChatCompletion(question) {
    return groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Using ${question} as a reference, recommend 4 movies that would be recommended to someone who enjoyed ${question}. Format this as a string of 4 movie titles separated by commas. Do not include ${question} itself as a recommendation`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
  }
  
  return (
<div className="flex flex-col items-center p-4 space-y-4">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Enter a movie you enjoyed..."
          value={inputMovie}
          onChange={(e) => setInputMovie(e.target.value)}
          className="w-64"
        />
        <button onClick={() => getRecommendations(inputMovie)}>Show Recommendations</button>
      </div>
      {recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="text-center">
            <p className="font-bold">{rec.title}</p>
            {rec.videoId && <YouTubePlayer videoId={rec.videoId} title={rec.title} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;