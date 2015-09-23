Matches = new Mongo.Collection("matches");

if (Meteor.isClient) {
    Meteor.subscribe("userStatus");
    Meteor.subscribe("matches");

    Session.setDefault('userSelection', null);

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
            });
        }
    });

    Template.rps.events({
        'click .rps': event => {
            var thisPlayer = Meteor.userId();
            var filter = {_id: this._id};
            console.log(Matches.findOne(filter));
            var match = Matches.findOne({_id: this._id});
            if (match.playerOne === thisPlayer) {
                match.playerOneChoice = event.target.value;
            }
            Matches.update(this._id, match);
        }
    });

    Template.userCount.helpers({
        usersOnline: () => {
            return Meteor.users.find({"status.online": true}, {$neq: {"_id": Meteor.userId()}});
        },
        usersOnlineCount: () => {
            return Meteor.users.find({ "status.online": true}).count();
        }
    });

    Template.userCount.events({
        "click .user": event => {
            console.log(event);
            console.log(this);

            var thisPlayer = Meteor.user().username;
            var otherPlayer = event.target.value;

            Matches.insert({
                playerOne: thisPlayer,
                playerTwo: otherPlayer
            });

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
        Meteor.publish("matches", () => {
            return Matches.find();
        });
    });
}
