require('dotenv').config();
const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const { toXML } = require('jstoxml');
const app = express();
const cors = require('cors');

const router = express.Router();
app.use('*', cors());

const xmlOptions = {
  header: true,
  indent: '  '
};

function createXMLDoc(title, description, link, doc) {
  const xmlItems = doc.map((post) => {
    return {
      item: post
    }
 })
  
  return {
    _name: 'rss',
    _attrs: {
      version: '2.0'
    },
    _content: {
      channel: [
        { title },
        { description },
        { link },
        { lastBuildDate: () => new Date() },
        { pubDate: () => new Date() },
        { language: 'en'},
        xmlItems
      ]
    }
  }
}

router.get('/sh-law/feed/:category/:pagination', async (req, res) => {
  try {
    const { pagination, category } = req.params;
    const firmNews = await axios.get(`${process.env.BASE_URL}/category/posts/${category}`)      

    // return paginated number of posts
    const parsedPagination = parseInt(pagination)
    const paginatedArticles = firmNews.data.latest.filter((_, index) => index <= (parsedPagination - 1));

    const title = `Latest ${category.toLocaleUpperCase()} From Scarinci Hollenbeck - Paginated Items By ${pagination}`
    const description = 'Scarinci Hollenbeck is a dynamic NJ, NY & DC business Law Firm. We help our clients achieve their goals by providing tailored legal services.'
    const link = `https://scarincihollenbeck.com/category/${category}`

    const firmNewsXML = createXMLDoc(title, description, link, paginatedArticles)
     
    const firmNewsRSSFeed = toXML(firmNewsXML, xmlOptions);  

		res.status(200).send(firmNewsRSSFeed);       
  } catch(error) {
    console.error(error);
    res.status(500).json({ error });
  }  
});

app.use('/.netlify/functions/server', router);

module.exports = app;
module.exports.handler = serverless(app);