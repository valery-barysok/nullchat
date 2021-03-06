Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
    waitOn: function () {
        return [Meteor.subscribe('users'),Meteor.subscribe('myPreferences')];
    }
});
Router.map(function () {
    this.route('/room/:_id', {
        subscriptions: function(){
            return [Meteor.subscribe('availableRooms'), Meteor.subscribe('currentRooms')];
        },
        onBeforeAction: function () {
            var room = Rooms.findOne({_id: this.params._id});
            if (!room) {
                Router.go('roomList');
            }
            Meteor.call('setCurrentRoom',this.params._id);
            this.next();
        },
        action:function(){
            Router.go('chat');
        }
    });
    this.route('userMetrics', {
        path: '/user/:userId/metrics',
        subscriptions: function () {
        },
        data: function () {
            return {userId: this.params.userId};
        },
        action: function () {
            this.render('userMetrics');
        }
    });
    this.route('roomMetrics', {
        path: '/room/:roomId/metrics',
        subscriptions: function () {
            return [
                Meteor.subscribe('availableRooms'),
                Meteor.subscribe('currentRooms')
            ];
        },
        data: function () {
            return {roomId: this.params.roomId};
        },
        action: function () {
            this.render('roomMetrics');
        }
    });
    this.route('chat', {
        path: '/',
        subscriptions: function () {
            return [
                Meteor.subscribe('availableRooms'),
                Meteor.subscribe('currentRooms'),
                Meteor.subscribe('notifications'),
                Meteor.subscribe('emojis'),
                Meteor.subscribe('memes')
            ];
        },
        action: function () {
            var currentRoom = Meteor.user().status.currentRoom;
            if (!currentRoom) {
                currentRoom = Rooms.findOne({name: "welcome"})._id;
                Meteor.call('joinRoom', currentRoom);
            }
            Session.set('currentRoom', currentRoom);
            this.render('roomView');
        }
    });

    this.route('messageSms', {
        name: 'messageSms',
        where: "server",
        path: 'messageSms',
        action: function () {
            var token = Meteor.settings.twilio.appSecret;
            var header = this.request.headers['x-twilio-signature'];
            var url = Meteor.absoluteUrl("messageSms",{secure: true});
            var params = this.request.body;
            var twilio = Meteor.npmRequire('twilio');
            if (this.request.body && twilio.validateRequest(token,header,url,params)) {
                var fromNumber = this.request.body.From;
                if (fromNumber) {
                    var user = Meteor.users.findOne({"profile.number": fromNumber});
                    if (user) {
                        var message = this.request.body.Body;
                        var roomMatch = /#([\w]+)/.exec(message);
                        if (roomMatch && roomMatch[1]) {
                            var roomName = roomMatch[1];
                            var room = Rooms.findOne({name: roomName});
                            if (room) {
                                console.log("From " + fromNumber + " : " + message + " for " + room.name);
                                insertMessage(user, room, {message: message, roomId: room._id}, {fromMobile: true});
                            }
                            else {
                                console.log("From " + fromNumber + " : " + message + " can't find room: " + roomName);
                            }
                        }
                        else {
                            console.log("From " + fromNumber + " : " + message + " no room listed.");
                        }
                    }
                    else {
                        console.log("No user registered with " + fromNumber);
                    }
                }
            }
        }
    });
});

Router.plugin('ensureSignedIn', {except: ['messageSms']});