/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';


// Shortcuts to DOM Elements.
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('new-post-message');
var titleInput = document.getElementById('new-post-title');
var signInButton = document.getElementById('sign-in-button');
var signOutButton = document.getElementById('sign-out-button');
var splashPage = document.getElementById('page-splash');
var addPost = document.getElementById('add-post');
var addButton = document.getElementById('add');
var recentPostsSection = document.getElementById('recent-posts-list1');
var recentPostsSection2 = document.getElementById('recent-posts-list2');
var recentPostsSection3 = document.getElementById('recent-posts-list3');
var userPostsSection = document.getElementById('user-posts-list');
var topUserPostsSection = document.getElementById('top-user-posts-list');
var recentMenuButton = document.getElementById('menu-recent');
var myPostsMenuButton = document.getElementById('menu-my-posts');
var myTopPostsMenuButton = document.getElementById('menu-my-top-posts');
var videoDiv = document.getElementById('video-div');
var listeningFirebaseRefs = [];

/**
 * Saves a new post to the Firebase DB.
 */
// [START write_fan_out]
function writeNewPost(uid, username, picture, title, body) {
  // A post entry.
  var postData = {
    author: username,
    uid: uid,
    body: body,
    title: title,
    starCount: 0,
    authorPic: picture
  };

  // Get a key for a new Post.
  var newPostKey = firebase.database().ref().child('posts').push().key;

  // Write the new post's data simultaneously in the posts list and the user's post list.
  var updates = {};
  updates['/posts/' + newPostKey] = postData;
  updates['/user-posts/' + uid + '/' + newPostKey] = postData;

  return firebase.database().ref().update(updates);
}
// [END write_fan_out]

/**
 * Star/unstar post.
 */
// [START post_stars_transaction]
// function toggleStar(postRef, uid) {
//   postRef.transaction(function(post) {
//     if (post) {
//       if (post.stars && post.stars[uid]) {
//         post.starCount--;
//         post.stars[uid] = null;
//       } else {
//         post.starCount++;
//         if (!post.stars) {
//           post.stars = {};
//         }
//         post.stars[uid] = true;
//       }
//     }
//     return post;
//   });
// }
// [END post_stars_transaction]

/**
 * Creates a post element.
 */
function createPostElement(postId, title, text, author, authorId, authorPic) {
  var uid = firebase.auth().currentUser.uid;

  var html =
      
          '<div class="text"></div>' +
          '<div class="comments-container"></div>' +
          '<form class="add-comment" action="#">' +
            '<div class="mdl-textfield mdl-js-textfield">' +
              '<input class="mdl-textfield__input new-comment" type="text">' +
              '<label class="mdl-textfield__label"></label>' +
            '</div>' +
          '</form>';
       

  // Create the DOM element from the HTML.
  var div = document.createElement('div');
  div.innerHTML = html;
 // var postElement = div.firstChild;
   var postElement = div;
  if (componentHandler) {
   // componentHandler.upgradeElements(postElement.getElementsByClassName('mdl-textfield')[0]);
  }

  var addCommentForm = postElement.getElementsByClassName('add-comment')[0];
  var commentInput = postElement.getElementsByClassName('new-comment')[0];
 // var star = postElement.getElementsByClassName('starred')[0];
 // var unStar = postElement.getElementsByClassName('not-starred')[0];

  // Set values.
  postElement.getElementsByClassName('text')[0].innerText = text;
 // postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = title;
 // postElement.getElementsByClassName('username')[0].innerText = author || 'Anonymous';
 // postElement.getElementsByClassName('avatar')[0].style.backgroundImage = 'url("' +
    //  (authorPic || './silhouette.jpg') + '")';

  // Listen for comments.
  // [START child_event_listener_recycler]
  var commentsRef = firebase.database().ref('post-comments/' + postId);
  commentsRef.on('child_added', function(data) {
    addCommentElement(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_changed', function(data) {
    setCommentValues(postElement, data.key, data.val().text, data.val().author);
  });

  commentsRef.on('child_removed', function(data) {
    deleteComment(postElement, data.key);
  });
  // [END child_event_listener_recycler]

  // Listen for likes counts.
  // [START post_value_event_listener]
 //  var starCountRef = firebase.database().ref('posts/' + postId + '/starCount');
//   starCountRef.on('value', function(snapshot) {
//     updateStarCount(postElement, snapshot.val());
//   });
  // [END post_value_event_listener]

  // Listen for the starred status.
  // var starredStatusRef = firebase.database().ref('posts/' + postId + '/stars/' + uid);
//   starredStatusRef.on('value', function(snapshot) {
//     updateStarredByCurrentUser(postElement, snapshot.val());
//   });

  // Keep track of all Firebase reference on which we are listening.
  listeningFirebaseRefs.push(commentsRef);
  //listeningFirebaseRefs.push(starCountRef);
  //listeningFirebaseRefs.push(starredStatusRef);

  // Create new comment.
  addCommentForm.onsubmit = function(e) {
    e.preventDefault();
    createNewComment(postId, firebase.auth().currentUser.displayName, uid, commentInput.value);
    commentInput.value = '';
    commentInput.parentElement.MaterialTextfield.boundUpdateClassesHandler();
  };

  //Bind starring action.
 //  var onStarClicked = function() {
//     var globalPostRef = firebase.database().ref('/posts/' + postId);
//     var userPostRef = firebase.database().ref('/user-posts/' + authorId + '/' + postId);
//     toggleStar(globalPostRef, uid);
//     toggleStar(userPostRef, uid);
//   };
//   unStar.onclick = onStarClicked;
//   star.onclick = onStarClicked;

  return postElement;
}

/**
 * Writes a new comment for the given post.
 */
function createNewComment(postId, username, uid, text) {
  firebase.database().ref('post-comments/' + postId).push({
    text: text,
    author: username,
    uid: uid
  });
}

/**
 * Updates the starred status of the post.
 */
// function updateStarredByCurrentUser(postElement, starred) {
//   if (starred) {
//     postElement.getElementsByClassName('starred')[0].style.display = 'inline-block';
//     postElement.getElementsByClassName('not-starred')[0].style.display = 'none';
//   } else {
//     postElement.getElementsByClassName('starred')[0].style.display = 'none';
//     postElement.getElementsByClassName('not-starred')[0].style.display = 'inline-block';
//   }
// }

/**
 * Updates the number of stars displayed for a post.
 */
// function updateStarCount(postElement, nbStart) {
//   postElement.getElementsByClassName('star-count')[0].innerText = nbStart;
// }

/**
 * Creates a comment element and adds it to the given postElement.
 */
function addCommentElement(postElement, id, text, author) {
  var comment = document.createElement('div');
  comment.classList.add('comment-' + id);
  comment.innerHTML = '<span class="username"></span><span class="comment"></span>';
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('username')[0].innerText = author || 'Anonymous';

  var commentsContainer = postElement.getElementsByClassName('comments-container')[0];
  commentsContainer.appendChild(comment);
}

/**
 * Sets the comment's values in the given postElement.
 */
function setCommentValues(postElement, id, text, author) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
  comment.getElementsByClassName('comment')[0].innerText = text;
  comment.getElementsByClassName('fp-username')[0].innerText = author;
}

function timeStamp(now) {
// Create a date object with the current time
  //var now = new Date();

// Create an array with the current month, day and time
  var date = [ now.getMonth() + 1, now.getDate(), now.getFullYear() ];

// Create an array with the current hour, minute and second
  var time = [ now.getHours(), now.getMinutes(), now.getSeconds() ];

// Determine AM or PM suffix based on the hour
  var suffix = ( time[0] < 12 ) ? "AM" : "PM";

// Convert hour from military time
  time[0] = ( time[0] < 12 ) ? time[0] : time[0] - 12;

// If hour is 0, set it to 12
  time[0] = time[0] || 12;

// If seconds and minutes are less than 10, add a zero
  for ( var i = 1; i < 3; i++ ) {
    if ( time[i] < 10 ) {
      time[i] = "0" + time[i];
    }
  }

// Return the formatted string
  return time.join(":") + " " + suffix;
}

/**
 * Deletes the comment of the given ID in the given postElement.
 */
function deleteComment(postElement, id) {
  var comment = postElement.getElementsByClassName('comment-' + id)[0];
 // comment.parentElement.removeChild(comment);
}

/**
 * Starts listening for new posts and populates posts lists.
 */
function startDatabaseQueries() {
  // [START my_top_posts_query]
  var myUserId = firebase.auth().currentUser.uid;
  var topUserPostsRef = firebase.database().ref('responses/user1');
  var userList = firebase.database().ref('responses/user1');
  // [END my_top_posts_query]
  // [START recent_posts_query]
  var recentPostsRef = firebase.database().ref('responses/user1').limitToLast(100);
  var recentPostsRef2 = firebase.database().ref('responses/user2').limitToLast(100);
  var recentPostsRef3 = firebase.database().ref('responses/user3').limitToLast(100);
  // [END recent_posts_query]
  var userPostsRef = firebase.database().ref('responses/user1');

  var fetchPosts = function(postsRef, sectionElement) {
  var date  = new Date();
  postsRef = postsRef.orderByChild("timestamp").startAt(date.toString());
    postsRef.on('child_added', function(data) {
    var dataObj = data.val();
      var author = "user1" || 'Anonymous';
      var key = data.key;
      var text = dataObj.sentences[0].text.content || '';
      var sent = dataObj.documentSentiment.score;
      var tsRaw = new Date(dataObj.timestamp);
      var ts = timeStamp(tsRaw);
      var containerElement = sectionElement.getElementsByClassName('pcontent')[0];
      containerElement.insertBefore(
        createPostElement(key,author, text +" "+ sent, author,1, data.val().authorPic),
        containerElement.firstChild);
        var text =0;
    });
    postsRef.on('child_changed', function(data) {
     //  var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
//       var postElement = containerElement.getElementsByClassName('post-' + data.key)[0];
//       postElement.getElementsByClassName('mdl-card__title-text')[0].innerText = data.val().title;
//       postElement.getElementsByClassName('username')[0].innerText = data.val().author;
//       postElement.getElementsByClassName('text')[0].innerText = data.val().body;
    //  postElement.getElementsByClassName('star-count')[0].innerText = data.val().starCount;
    });
    postsRef.on('child_removed', function(data) {
      var containerElement = sectionElement.getElementsByClassName('posts-container')[0];
     // var post = containerElement.getElementsByClassName('post-' + data.key)[0];
     // post.parentElement.
     (post);
    });
  };

  // Fetching and displaying all posts of each sections.
 // fetchPosts(topUserPostsRef, topUserPostsSection);
  fetchPosts(recentPostsRef, recentPostsSection);
  fetchPosts(recentPostsRef2, recentPostsSection2);
  fetchPosts(recentPostsRef3, recentPostsSection3);
 // fetchPosts(userPostsRef, userPostsSection);

  // Keep track of all Firebase refs we are listening to.
  //listeningFirebaseRefs.push(topUserPostsRef);
  listeningFirebaseRefs.push(recentPostsRef);
  listeningFirebaseRefs.push(recentPostsRef2);
  listeningFirebaseRefs.push(recentPostsRef3);
 // listeningFirebaseRefs.push(userPostsRef);
}

/**
 * Writes the user's data to the database.
 */
// [START basic_write]
function writeUserData(userId, name, email, imageUrl) {
  firebase.database().ref('users/' + userId).set({
    username: name,
    email: email,
    profile_picture : imageUrl
  });
}
// [END basic_write]

/**
 * Cleanups the UI and removes all Firebase listeners.
 */
function cleanupUi() {
  // Remove all previously displayed posts.
  topUserPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  recentPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';
  userPostsSection.getElementsByClassName('posts-container')[0].innerHTML = '';

  // Stop all currently listening Firebase listeners.
  listeningFirebaseRefs.forEach(function(ref) {
    ref.off();
  });
  listeningFirebaseRefs = [];
}

/**
 * The ID of the currently signed-in User. We keep track of this to detect Auth state change events that are just
 * programmatic token refresh but not a User status change.
 */
var currentUID;

/**
 * Triggers every time there is a change in the Firebase auth state (i.e. user signed-in or user signed out).
 */
function onAuthStateChanged(user) {
  // We ignore token refresh events.
  if (user && currentUID === user.uid) {
    return;
  }

 // cleanupUi();
  if (user) {
    currentUID = user.uid;
    splashPage.style.display = 'none';
    writeUserData(user.uid, user.displayName, user.email, user.photoURL);
    startDatabaseQueries();
  } else {
    // Set currentUID to null.
    currentUID = null;
    // Display the splash page where you can sign-in.
    splashPage.style.display = '';
  }
}

/**
 * Creates a new post for the current user.
 */
function newPostForCurrentUser(title, text) {
  // [START single_value_read]
  var userId = firebase.auth().currentUser.uid;
  return firebase.database().ref('/users/' + userId).once('value').then(function(snapshot) {
    var username = (snapshot.val() && snapshot.val().username) || 'Anonymous';
    // [START_EXCLUDE]
    return writeNewPost(firebase.auth().currentUser.uid, username,
      firebase.auth().currentUser.photoURL,
      title, text);
    // [END_EXCLUDE]
  });
  // [END single_value_read]
}

/**
 * Displays the given section element and changes styling of the given button.
 */
function showSection(sectionElement, buttonElement) {
  recentPostsSection.style.display = 'none';
  userPostsSection.style.display = 'none';
  topUserPostsSection.style.display = 'none';
  addPost.style.display = 'none';
  recentMenuButton.classList.remove('is-active');
  myPostsMenuButton.classList.remove('is-active');
  myTopPostsMenuButton.classList.remove('is-active');

  if (sectionElement) {
    sectionElement.style.display = 'block';
  }
  if (buttonElement) {
    buttonElement.classList.add('is-active');
  }
}

// Bindings on load.
window.addEventListener('load', function() {
  // Bind Sign in button.
  signInButton.addEventListener('click', function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider);
  });

  // Bind Sign out button.
  signOutButton.addEventListener('click', function() {
    firebase.auth().signOut();
  });

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(onAuthStateChanged);

  // Saves message on form submit.
  messageForm.onsubmit = function(e) {
    e.preventDefault();
    var text = messageInput.value;
    var title = titleInput.value;
    if (text && title) {
      newPostForCurrentUser(title, text).then(function() {
        myPostsMenuButton.click();
      });
      messageInput.value = '';
      titleInput.value = '';
    }
  };

  // Bind menu buttons.
  recentMenuButton.onclick = function() {
    showSection(recentPostsSection, recentMenuButton);
  };
  myPostsMenuButton.onclick = function() {
    showSection(userPostsSection, myPostsMenuButton);
  };
  myTopPostsMenuButton.onclick = function() {
    showSection(topUserPostsSection, myTopPostsMenuButton);
  };
  addButton.onclick = function() {
    showSection(addPost);
    messageInput.value = '';
    titleInput.value = '';
  };
  recentMenuButton.onclick();
}, false);
