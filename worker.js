export default {
  async fetch(request) {
    const url = new URL(request.url);
    const channel = url.pathname.replace("/", "");  

    // Fetch the CSV from GitHub
    const res = await fetch("https://skabajah.github.io/iptv/channels.csv");
    const text = await res.text();

    // Parse CSV into a dictionary
    const channels = {};
    text.split("\n").forEach(line => {
      // const [name, stream] = line.trim().split(",");
      const [name, stream] = line.trim().split(/\t|,/);
      if (name && stream) channels[name] = stream;
    });

    // Redirect or show list
    if (channels[channel]) {
      return Response.redirect(channels[channel], 302);
    } else {
      const list = Object.keys(channels)
        .map(ch => `<li><a href='/${ch}'>${ch}</a></li>`)
        .join("");
      return new Response(`<h3>Available Channels:</h3><ul>${list}</ul>`, {
        headers: { "content-type": "text/html" },
      });
    }
  },
};
