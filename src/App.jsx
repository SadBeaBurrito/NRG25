import logo from "./logo.svg";
import "./App.css";
import React, { useState, useEffect } from "react";
import Groq from "groq-sdk";
import YouTubePlayer from "./components/YouTubePlayer";
import axios from "axios";

function App() {
  const USE_YOUTUBE_API = true; // Toggle youtube api usage to save creds (True = on)
  const groq = new Groq({ apiKey: process.env.REACT_APP_API_KEY_GROQ, dangerouslyAllowBrowser: true });
  
  async function getRecommendations(question) {
    // func to ask groq for recomendations based off a previously enjoyed movie
    const chatCompletion = await getGroqChatCompletion(question);
    // arranges response into array of movie titles
    const movieList = chatCompletion.choices[0]?.message?.content.split(',').map(movie => movie.trim());

    if (USE_YOUTUBE_API) {
      // search youtube for edits of each movie
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
      // if youtube api off, use only movie titles
      const moviesWithTitles = movieList.map(movie => ({
        title: movie,
        videoId: null
      }));
      setRecommendations(moviesWithTitles);
    }
  }

  // func searches youtube and returns vids of edits for a given movie
  async function searchYoutube(movieTitle) {
    if (!USE_YOUTUBE_API) return null;
    
    try {
      const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
        params: {
          key: process.env.REACT_APP_API_KEY_YT,
          q: `${movieTitle} movie edits`,
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
  
  const [inputMovie, setInputMovie] = useState(""); // input field
  const [recommendations, setRecommendations] = useState([]); // movie recommendations

  // func asks llama to get movie recommendations with some output specifications
  async function getGroqChatCompletion(question) {
    return groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: `Using ${question} as a reference, recommend 4 movies that would be recommended to someone who enjoyed ${question}. Format this as a string of 4 movie titles separated by commas. Do not include ${question} itself as a recommendation. If you do not recognize the title, return "unrecognized title".`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });
  }
  
  return (
    <div className="app-container">
      <div className="content-container">
        {/* header */}
        <h1 className="app-title">
          Movie Motivator
        </h1>
        <p className="app-description">
          Enter a movie you want to discover similar movies to.
        </p>

        {/* search bar + button */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Enter a movie..."
            value={inputMovie}
            onChange={(e) => setInputMovie(e.target.value)}
            className="search-input"
          />
          <button 
            onClick={() => {
              if (inputMovie.trim()) {
                getRecommendations(inputMovie)
              }
            }}
            className="search-button"
          >
            Search
          </button>
        </div>

        {/* edit output section */}
        {recommendations.length > 0 && (
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="movie-card"
              >
                <div className="movie-content">
                  <h2 className="movie-title">{rec.title}</h2>
                  {/* if youtube on, gets the vid display, otherwise placeholder */}
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