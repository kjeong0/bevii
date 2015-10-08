Matches = new Mongo.Collection("matches");
Leaders = new Mongo.Collection("leaders");

if (Meteor.isClient) {
    Meteor.subscribe("userStatus");
    Meteor.subscribe("matches");
    Meteor.subscribe("leaders");

    Session.setDefault('userSelection', null);

    Template.followers.helpers({
        leaders: () => {
            return Leaders.find();
        }
    });

    Template.admin.helpers({
        isAdmin: () => {
            if (Meteor.user()) {
                return Meteor.user().username == "admin";
            }
            return false;
        }
    });

    Template.admin.events({
        'click #admin': function(event) {
            Meteor.call('startRound');
        },
        'click #killServer': function(event) {
            Meteor.call('killServer');
        }
    });

    Template.rps.helpers({
        userSelection: () => {
            return Session.get('userSelection');
        },
        userInMatch: () => {
            /* Returns true if the user is currently in a RPS match.
             */
            return Matches.find({
                $or: [
                    {playerOne: Meteor.user().username},
                    {playerTwo: Meteor.user().username}
                ]
            }).count() > 0;
        },
        matches: () => {
            return Matches.find({
                $or: [
                    playerOne: Meteor.user().username},
                    {playerTwo: Meteor.user().username}
                ]
            }, {sort: {date: -1}});
        },
        waitingForOtherPlayer: function() {
            /* Returns true if opponent still has to make a move */
            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            var match = Matches.find(this._id);
            return this[otherPlayer] === undefined;
        },
        makeMove: function() {
            /* Return true if the player still has to make a move */
            return this[Meteor.user().username] === undefined;
        },
        matchDate: function() {
            return moment(this.date).fromNow();
        },
        matchOpponent: function() {
            return Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
        },
        matchOutcome: function() {
            if (this.winner.toUpperCase() === "TIE") {
                return "Tie";
            }
            return Meteor.user().username === this.winner ? "Won" : "Lost";
        }
    });

    Template.rps.events({
        'click .rps': function(event) {
            var choice = event.currentTarget.value;
            Meteor.call('playerChoose', this._id, choice);
        }
    });

    Template.userCount.helpers({
        usersOnline: () => {
            return Meteor.users.find({"status.online": true, _id: {$ne: Meteor.userId()}});
        },
        usersOnlineCount: () => {
            return Meteor.users.find({ "status.online": true}).count();
        }
    });

    Template.userCount.events({
        "click .user": function(event) {
            console.log(event);
            console.log(this);

            var thisPlayer = Meteor.user().username;
            var otherPlayer = event.target.value;

            Matches.insert({
                playerOne: thisPlayer,
                playerTwo: otherPlayer,
                date: new Date()
            });

        }
    });

    Template.userCountMini.helpers({
        usersOnlineCount: () => {
            return Meteor.users.find({ "status.online": true}).count();
        }
    });

    Accounts.ui.config({
        passwordSignupFields: "USERNAME_ONLY",
        extraSignupFields: [{
            fieldName: 'first_name',
            fieldLabel: 'First name',
            inputType: 'text',
            visible: true,
            validate: function(value, errorFunction) {
                if (!value) {
                    errorFunction("Please enter your first name");
                    return false;
                }
                return true;
            }
        }, {
            fieldName: 'last_name',
            fieldLabel: 'Last name',
            inputType: 'text',
            visible: true,
            validate: function(value, errorFunction) {
                if (!value) {
                    errorFunction("Please enter your last name");
                    return false;
                }
                return true;
            }
        }]
    });
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        Meteor.publish("userStatus", () => {
            return Meteor.users.find({"status.online": true});
        });
        Meteor.publish("leaders", () => {
            return Leaders.find();
        });
        Meteor.publish("matches", () => {
            return Matches.find();
        });
    });

    var makeMatch = (playerOneName, playerTwoName) => {
        Matches.insert({
            playerOne: playerOneName,
            playerTwo: playerTwoName,
            date: new Date()
        });
    };

    var isPlayerInMatch = player => {
        return Matches.find({
            $and: [
                {
                    $or: [
                        {playerOne: player},
                        {playerTwo: player}
                    ]
                },
                {
                    winner: {$exists: false}
                }
            ]
        }).count() > 0;
    };

    // Every __ seconds check if there is a winner and
    // we check if there are people without games and then we match them
    var timer = Meteor.setInterval(function() {
        // check if there is a winner
        // leader
        if (Leaders.find().fetch().length == 1) {
            // there is a winner
            // print out winner

            // stop interval
            clearInterval(timer);
            return;
        }

        // Matchmaking
        var leaders = Leaders.find();
        var availablePlayers = [];
        leaders.forEach(function(leader) {
            var leaderName = leader.leader;
            if(!isPlayerInMatch(leaderName)) {
                availablePlayers.push(leaderName);
            }
            if (availablePlayers.length >= 2) {
                makeMatch(availablePlayers[0], availablePlayers[1]);
                availablePlayers = [];
            }
        });
    }, 1000);



    Meteor.methods({
        updateLeaders: function (winnerName, loserName) {
            var loser = Leaders.findOne({leader: loserName});
            Leaders.update({leader: winnerName}, {$addToSet: {followers: loser.followers}});
            Leaders.update({leader: winnerName}, {$push: {followers: loser.leader}});
            Leaders.remove({leader: loserName});
        },
        playerChoose: function(id, choice) {
            // Add a key indicating the user's choice and checks for winner if possible
            var match = Matches.findOne({_id: id});
            var updateQuery = {$set: {}};
            updateQuery.$set[Meteor.user().username + ".choice"] = choice;
            Matches.update(id, updateQuery);
            var otherPlayer = Meteor.user().username === match.playerOne ? match.playerTwo : match.playerOne;
            if(match[otherPlayer] !== undefined) {
                var getWinner = function(playerOneName, playerTwoName) {
                    var playerOneChoice = choice;
                    var playerTwoChoice = match[playerTwoName].choice;
                    if ((playerOneChoice === "rock" && playerTwoChoice ==="scissors") ||
                        (playerOneChoice === "scissors" && playerTwoChoice ==="paper") ||
                        (playerOneChoice === "paper" && playerTwoChoice ==="rock")) {
                        Matches.update(id, {$set: {winner: playerOneName}});
                        Meteor.call('updateLeaders', playerTwoName, playerOneName);
                    } else if ((playerTwoChoice === "rock" && playerOneChoice ==="scissors") ||
                               (playerTwoChoice === "scissors" && playerOneChoice ==="paper") ||
                               (playerTwoChoice === "paper" && playerOneChoice ==="rock")) {
                        Matches.update(id, {$set: {winner: playerTwoName}});
                        Meteor.call('updateLeaders', playerTwoName, playerOneName);
                    } else {
                        Matches.update(id, {$set: {winner: "tie"}});
                    }
                }.bind(this);
                getWinner(Meteor.user().username, otherPlayer);
            }
        },
        startRound: function () {
            var users_online = Meteor.users.find({ "status.online": true});
            users_online.forEach(function(user) {
                var leaderName = user.username;
                Leaders.insert({leader: leaderName, followers: []});
            });
        },
        killServer: function () {
            Leaders.remove({});
        }
    });
}
