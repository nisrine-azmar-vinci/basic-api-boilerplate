const express = require('express');
const { serialize, parse } = require('../utils/json');

const router = express.Router();

// eslint-disable-next-line import/order
const path = require('node:path');

const jsonDbPath = path.join(__dirname, '/../data/films.json');

const defaultFilms = [
  {
    id: 1,
    title: 'Parasite',
    duration: 120,
    budget: 50.5,
    link: 'https://www.imdb.com/title/tt6751668/?ref_=ext_shr_lnk',
  },
  {
    id: 2,
    title: 'Moonlight',
    duration: 151,
    budget: 15.5,
    link: 'https://www.imdb.com/title/tt4975722/?ref_=ext_shr_lnk',
  },
  {
    id: 3,
    title: 'Waves',
    duration: 215,
    budget: 10.2,
    link: 'https://www.imdb.com/title/tt8652728/?ref_=ext_shr_lnk',
  },
];

router.get('/:id', (req, res) => {
  // eslint-disable-next-line no-template-curly-in-string, no-console
  console.log('GET /films/${req.params.id}');
  const films = parse(jsonDbPath, defaultFilms);
  // eslint-disable-next-line eqeqeq
  const indexOfFilmFound = films.findIndex((film) => film.id == req.params.id);

  if (indexOfFilmFound < 0) return res.sendStatus(404);

  return res.json(films[indexOfFilmFound]);
});

// Read all the films, filtered by minimum-duration if the query param exists
router.get('/', (req, res) => {
  const minimumFilmDuration = req?.query ? Number(req.query['minimum-duration']) : undefined;
  if (typeof minimumFilmDuration !== 'number' || minimumFilmDuration <= 0)
    return res.sendStatus(400);

  const films = parse(jsonDbPath, defaultFilms);

  if (!minimumFilmDuration) return res.json(films);

  const filmsReachingMinimumDuration = films.filter((film) => film.duration >= minimumFilmDuration);
  return res.json(filmsReachingMinimumDuration);
});

// eslint-disable-next-line consistent-return
router.post('/', (req, res) => {
  const budget =
    typeof req.body.budget === 'number' && req.body.budget >= 0 ? req.body.budget : undefined;
  const duration =
    typeof req.body.duration === 'number' && req.body.duration >= 0 ? req.body.duration : undefined;

  // eslint-disable-next-line no-console
  console.log('POST /myMovies');

  if (!budget || !duration || !req.body.title || !req.body.link) {
    return res.status(400).json({ error: 'Invalid film data' });
  }

  if (!budget || !duration) return res.sendStatus(400);

  const films = parse(jsonDbPath, defaultFilms);
  const existingFilm = films.find((film) => film.title === req.body.title);
  if (existingFilm) {
    return res.status(409).json({ error: 'Film with the same title already exist' });
  }

  const lastItemIndex = films?.length !== 0 ? films.length - 1 : undefined;
  const lastId = lastItemIndex !== undefined ? films[lastItemIndex]?.id : 0;
  const nextId = lastId + 1;

  const newFilm = {
    id: nextId,
    title: req.body.title,
    duration,
    budget,
    link: req.body.link,
  };
  films.push(newFilm);
  serialize(jsonDbPath, films);
  res.json(newFilm);
});

// eslint-disable-next-line consistent-return
router.delete('/:id', (req, res) => {
  // eslint-disable-next-line no-template-curly-in-string, no-console
  console.log('DELETE /myMovies/${req.params.id}');

  const films = parse(jsonDbPath, defaultFilms);
  // eslint-disable-next-line eqeqeq
  const foundIndex = films.findIndex((film) => film.id == req.params.id);

  if (foundIndex < 0) return res.sendStatus(404);
  const itemsRemovedFromFilm = films.splice(foundIndex, 1);
  const itemRemoved = itemsRemovedFromFilm[0];

  serialize(jsonDbPath, films);

  res.json(itemRemoved);
});

// eslint-disable-next-line consistent-return
router.patch('/:id', (req, res) => {
  // eslint-disable-next-line no-template-curly-in-string, no-console
  console.log('PATCH /myMovies/${req.params.id}');

  const title = req?.body?.title;
  const budget =
    typeof req.body.budget === 'number' && req.body.budget >= 0 ? req.body.budget : undefined;
  const duration =
    typeof req.body.duration === 'number' && req.body.duration >= 0 ? req.body.duration : undefined;
  const link = req?.body?.link;

  // eslint-disable-next-line no-console
  console.log('POST /myMovies');
  if (
    (!title && !duration && !budget && !link) ||
    title?.length === 0 ||
    duration?.length === 0 ||
    budget?.length === 0 ||
    link?.length === 0
  )
    return res.sendStatus(400);

  const films = parse(jsonDbPath, defaultFilms);

  // eslint-disable-next-line eqeqeq
  const foundIndex = films.findIndex((film) => film.id == req.params.id);
  if (foundIndex < 0) return res.sendStatus(404);
  const updateFilm = { ...films[foundIndex], ...req.body };
  films[foundIndex] = updateFilm;

  serialize(jsonDbPath, films);
  res.json(updateFilm);
});

// eslint-disable-next-line consistent-return
router.put('/:id', (req, res) => {
  // eslint-disable-next-line no-template-curly-in-string, no-console
  console.log('PUT /myMovies/${req.params.id}');
  const filmIdUpdate = parseInt(req.params.id, 10);

  const budget =
    typeof req.body.budget === 'number' && req.body.budget >= 0 ? req.body.budget : undefined;
  const duration =
    typeof req.body.duration === 'number' && req.body.duration >= 0 ? req.body.duration : undefined;

  if (!budget || !duration || !req.body.title || !req.body.link) {
    return res.status(400).json({ error: 'Invalid film data' });
  }

  const films = parse(jsonDbPath, defaultFilms);

  const existingFilm = films.findIndex((film) => film.id === filmIdUpdate);

  if (existingFilm < 0) {
    // Si la ressource n'existe pas, créé la ressource seulement si l'id n'existe pas déjà
    const filmWithSameId = films.find((film) => film.id === filmIdUpdate);
    if (filmWithSameId) {
      return res.status(409).json({ error: 'Film with the same id already exist' });
    }

    // Créez une nouvelle ressource
    const newFilm = {
      id: filmIdUpdate,
      title: req.body.title,
      duration,
      budget,
      link: req.body.link,
    };

    films.push(newFilm);
  } else {
    // Si la ressource existe, mettez à jour la ressource avec les valeurs de la requête
    const updatedFilm = films[existingFilm];

    updatedFilm.title = req.body.title;
    updatedFilm.budget = req.body.budget;
    updatedFilm.duration = req.body.duration;
    updatedFilm.link = req.body.link;

    films[existingFilm] = updatedFilm;
    serialize(jsonDbPath, films);
    return res.json(updatedFilm);
  }
});

module.exports = router;
