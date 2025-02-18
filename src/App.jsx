import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import Groq from "groq-sdk";
import YouTubePlayer from "./components/YouTubePlayer";
import axios from "axios";

function App() {
  const USE_YOUTUBE_API = false; // Toggle this to true when you want to use YouTube API
  const groq = new Groq({ apiKey: process.env.REACT_APP_API_KEY_GROQ, dangerouslyAllowBrowser: true });
  
  
  async function getRecommendations(question) {
    const chatCompletion = await getGroqChatCompletion(question);
    const movieList = chatCompletion.choices[0]?.message?.content.split(',').map(movie => movie.trim());
    console.log(movieList);

    if (USE_YOUTUBE_API) {
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
    } else {
      const moviesWithTitles = movieList.map(movie => ({
        title: movie,
        videoId: null
      }));
      setRecommendations(moviesWithTitles);
    }
  }

  async function searchYoutube(movieTitle) {
    if (!USE_YOUTUBE_API) return null;
    
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
          content: `Using ${question} as a reference, recommend 4 movies that would be recommended to someone who enjoyed ${question}. Format this as a string of 4 movie titles separated by commas. Do not include ${question} itself as a recommendation. If you do not recognize the title, return "unrecognized title"`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
  }
  
  return (
    <div className="app-container">
      <div className="content-container">
        {/* Header */}
        <h1 className="app-title">
          Movie Motivator
        </h1>
        <p className="app-description">
          Enter a movie you enjoy.
        </p>

        {/* Search Section */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter a movie you enjoyed..."
            value={inputMovie}
            onChange={(e) => setInputMovie(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => getRecommendations(inputMovie)}
            className="search-button"
          >
            Search
          </button>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="movie-card"
              >
                <div className="movie-content">
                  <h2 className="movie-title">{rec.title}</h2>
                  {USE_YOUTUBE_API && rec.videoId ? (
                    <YouTubePlayer videoId={rec.videoId}/>
                  ) : (
                    <div className="video-placeholder"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;