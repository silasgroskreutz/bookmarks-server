// using list router from lesson as starting point
// note to self: Recheck that you are getting proper references 
const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const store = require('../store')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

//line added for lesson 15
const serializeBookmark = bookmark => ({
  id: bookmark.id,
  title: bookmark.title,
  url: bookmark.url,
  description: bookmark.description,
  rating: Number(bookmark.rating),
})

bookmarksRouter
  .route('/bookmarks')
  // GET - Step 3 in lesson -- updated fir lesson 15 for DB
  .get((req, res, next) => {
    BookmarksService.getAllBookmarks(req.app.get('db'))
      .then(bookmarks => {
        res.json(bookmarks.map(serialBookmark))
      })
      .catch(next)
  })

  //Step 4 in lesson
  //reminder, using 'store' as we are not using db
  .post(bodyParser, (req, res) => {
    for (const field of ['title', 'url', 'rating']) {
        if (!req.body[field]) {
          logger.error(`${field} is required`)
          return res.status(400).send(`'${field}' is required`)
        }
      }
      const { title, url, description, rating } = req.body
      
      if (!Number.isInteger(rating) || rating < 0 || rating > 5) {
        logger.error(`Invalid rating '${rating}' supplied`)
        return res.status(400).send(`'rating' must be a number between 0 and 5`)
      }
  
      if (!isWebUri(url)) {
        logger.error(`Invalid url '${url}' supplied`)
        return res.status(400).send(`'url' must be a valid URL`)
      }
  
      const bookmark = { id: uuid(), title, url, description, rating }
  
      //removing store as we now using db pt16
      // store.bookmarks.push(bookmark)

      BookmarksService.insertBookmark(
        req.app.get('db'),
        newBookmark
      )
  
      logger.info(`Bookmark with id ${bookmark.id} created`)
      res
        .status(201)
        .location(`http://localhost:8000/bookmarks/${bookmark.id}`)
        .json(bookmark)
  })

  //updated to use DB in lesson 15
bookmarksRouter
  .route('/bookmarks/:bookmark_id')
  .get((req, res, next) => {
    const { bookmark_id } = req.params
    BookmarksService.getById(req.app.get('db'), bookmark_id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${bookmark_id} not found.`)
          return res.status(404).json({
            error: { message: `Bookmark not found.`}
          })
        }
        res.json(serialBookmark(bookmark))
      })
      .catch(next)
    
    //const bookmark = store.bookmarks.find(c => c.id == bookmark_id

    // res.json(bookmark)
  })
  // Step 5 from lesson
  .delete((req, res, next) => {
    const { bookmark_id } = req.params

    //const bookmarkIndex = store.bookmarks.findIndex(b => b.id === bookmark_id)

    BookmarksService.deleteBookmark(
      req.app.get('db'),
      bookmark_id
    )

    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${bookmark_id} not found.`)
      return res
        .status(404)
        .send('Bookmark Not Found')
    }

    store.bookmarks.splice(bookmarkIndex, 1)

    logger.info(`Bookmark with id ${bookmark_id} deleted.`)
    res
      .status(204)
      .end()
  })

module.exports = bookmarksRouter