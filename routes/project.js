var express = require('express');
var router = express.Router();
var firebase = require('firebase');
const config = require('./config');
const octokit = require('@octokit/rest')();

// initialize Firebase
firebase.initializeApp(config);

octokit.authenticate({
  type: 'oauth',
  key: 'dbc407eab78d60478da9',
  secret: 'a85529728a40158871c4b9a7e19dab6a81eeb24e'
})

/**
 * Gets all registered projects from Firebase
 */
router.get('/getList', (req, res, next) => {
  var database = firebase.database();
  var projectRef = database.ref('projects');

  const projectsList = [];

  const gotAll = (data) => {
    let tmp = data.val();
    projectsList.push(tmp);
  }

  const errData = (error) => {
    console.error('Something went wrong.');
    console.error(error);
  }

  projectRef.on('value', gotAll, errData);

  // Return project if availible
  if(projectsList)
    res.json({ status: 200, data: projectsList });
  else
    res.json({ status: 500, err: "Error while getting registered Repository List" });

  next();

});


/**
 * Fetches Repo Data from Github API
 * /project/getStatistics?owner=flxwu&repo=test
 */
router.get('/getStatistics', async (req, res, next) => {
  const { owner, repo } = req.query;
  const repoData = await octokit.repos.get({owner, repo});
  const contributors = await octokit.repos.getContributors({owner, repo});
  const data = {
    stars: repoData.data.stargazers_count,
    watchers: repoData.data.watchers_count,
    contributors: contributors.data[0].total,
    description: repoData.data.description,
  }

  // Return project if available
  if(data)
    res.json({ data: await data });
  else
    res.json({ status: 500, err: "Error while getting Repository Data" });
});

/**
 * All Repos of User from Github API
 * /project/getRepos?user=Qo2770
 */
router.get('/getRepos', async (req, res, next) => {
  const username = req.query.user;
  const repos = await octokit.repos.getForUser({ username });

  const repos_temp = repos.data;
  console.log(repos_temp);
  let data = [];
  for(i = 0; i < repos_temp.length; i++) {
    data.push(
      {
        name: repos_temp[i].name,
        stars: repos_temp[i].stargazers_count,
        watchers: repos_temp[i].watchers_count,
        description: repos_temp[i].description,
      }
    );
  }

  // let data = repos.data;
  // console.log(data);

  // Return project if available
  if(data)
    res.json({ data: await data });
  else
    res.json({ status: 500, err: "Error while getting Repository Data" });
});


/**
 * Adds new project to Firebase
 */
router.post('/add', (req, res, next) => {

  var database = firebase.database();

  console.log(req.body);

  // New entry
  var newProject = {
    id: req.body.id,
    name: req.body.name,
    owner: req.body.owner,
    description: req.body.description,
  };

  let dbProjects = database.ref('projects');

  // firebase callback after push finished
  const finished = (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('SUCCESS');
    }
  }

  let dbProject = dbProjects.push(newProject, finished);
  console.log('Firebase generated key: ' + dbProject.key);

  if(dbProject)
    res.json({ status: 200, data: dbProject.key });
  else
    res.json({ status: 500, err: "Error while adding project" });

  next();

});

module.exports = router;
