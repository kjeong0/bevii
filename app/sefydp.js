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
    })

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
                    {playerOne: Meteor.user().username},
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

    function updateLeaders (winnerName, loserName) {
        var loser = Leaders.find({leader: loserName});
        Leaders.update({leader: winnerName}, {$addToSet: {followers: loser.followers}});
        Leaders.update({leader: winnerName}, {$push: {followers: loser.leader}});
        Leaders.remove({leader: loserName});
        console.log('test');
    }

    Template.rps.events({
        'click .rps': function(event) {
            // Add a key indicating the user's choice and checks for winner if possible
            var updateQuery = {$set: {}};
            var choice = event.currentTarget.value;
            updateQuery.$set[Meteor.user().username + ".choice"] = event.currentTarget.value;
            Matches.update(this._id, updateQuery);

            var otherPlayer = Meteor.user().username === this.playerOne ? this.playerTwo : this.playerOne;
            if(this[otherPlayer] !== undefined) {
                /* Really ugly way to find the winner, refactor this later */
                var getWinner = function(playerOneName, playerTwoName) {
                    var playerOneChoice = choice;
                    var playerTwoChoice = this[playerTwoName].choice;
                    if ((playerOneChoice === "rock" && playerTwoChoice ==="scissors") ||
                        (playerOneChoice === "scissors" && playerTwoChoice ==="paper") ||
                        (playerOneChoice === "paper" && playerTwoChoice ==="rock")) {
                        Matches.update(this._id, {$set: {winner: playerOneName}});
                        updateLeaders(playerOneName, playerTwoName);
                    } else if ((playerTwoChoice === "rock" && playerOneChoice ==="scissors") ||
                               (playerTwoChoice === "scissors" && playerOneChoice ==="paper") ||
                               (playerTwoChoice === "paper" && playerOneChoice ==="rock")) {
                        Matches.update(this._id, {$set: {winner: playerTwoName}});
                        updateLeaders(playerTwoName, playerOneName);
                    } else {
                        Matches.update(this._id, {$set: {winner: "tie"}});
                    }
                }.bind(this);
                getWinner(Meteor.user().username, otherPlayer);
            }
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

            var leaders = Leaders.find({
                $or: [
                    {leader: thisPlayer},
                    {followers: { $elemMatch: {thisPlayer}}}
                ]
            });
            if (!leaders){
                Leaders.insert({leader: thisPlayer, follower: []});
            }

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
        passwordSignupFields: "USERNAME_ONLY"
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
}