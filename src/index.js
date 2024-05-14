/**
 * THIS COMPUTE CODE RUNS ON THE FASTLY EDGE
 *
 * 🚀 🚀 🚀 Make sure you deploy again whenever you make a change here 🚀 🚀 🚀
 *
 * Here's what happens in this website:
 *
 * User makes a request for the site
 * Compute code runs on a Fastly server
 *  - Grabs the user location from the request IP address
 *  - Makes the request to the origin for the site assets (HTML + CSS files, images)
 *  - Adds a cookie to the response and sends it back to the user
 * User's browser renders the web page and writes info to the page from the cookie
 *
 */

import { getGeolocationForIpAddress } from "fastly:geolocation";
let _ = require("lodash");
let where = "?",
  greeting = "Hello!";

// We use a function to handle requests to the origin
addEventListener("fetch", (event) => event.respondWith(handleRequest(event)));

async function handleRequest(_event) {
  //The request the user made
  let req = _event.request;
  let url = new URL(req.url);

  //Find out the user location info
  try {
    let ip =
      new URL(_event.request.url).searchParams.get("ip") ||
      _event.client.address;
    
    /* 
    Info you can get from geo
    https://js-compute-reference-docs.edgecompute.app/docs/fastly:geolocation/getGeolocationForIpAddress
    */
    let geo = getGeolocationForIpAddress(ip);

    // Where is the user
    where = _.startCase(_.toLower(geo.city)) + " " + geo.country_code;

    /* 
    // 🚧 🚧 🚧 Uncomment this block then deploy again 🚧 🚧 🚧 
    
    // Let's get the time of day and find out how far from UTC it is
    let displayTime = new Date().getHours();
    let offset = geo.utc_offset;
    displayTime += offset / 100;
    
    // Tailor the greeting to the user time of day
    greeting =
      displayTime > 4 && displayTime < 12
        ? "Morning!"
        : displayTime >= 12 && displayTime < 18
        ? "Afternoon!"
        : "Evening!";    
    */

    // Change the stylesheet
    if (url.pathname.indexOf(".css") >= 0) url.pathname = "/edge.css";
    // Send the home request to the origin page
    else if (url.pathname.endsWith("/")) url.pathname = "/index.html";

    // Build a new request
    req = new Request(url, req);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", {
      status: 500,
    });
  }
  //Get the origin response
  let backendResponse = await fetch(req, {
    backend: "glitch",
  });

  // Send a cookie indicating the user location and pop
  let pop = backendResponse.headers.get("x-served-by");
  pop = pop.substring(pop.lastIndexOf("-") + 1);
  backendResponse.headers.set(
    "Set-Cookie",
    "loc=" +
      greeting +
      " This reponse is being delivered by the Fastly " +
      pop +
      " POP for a request from " +
      where +
      "; SameSite=None; Secure"
  );

  // Send the backend response back to the client
  return backendResponse;
}
