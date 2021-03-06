Template.messageUser.rendered = function () {

};
Template.messageUser.helpers({
    'username': function () {
        var user = Meteor.users.findOne({_id:this.toString()},{fields:{"username":1}});
        return user.username;
    },
    'avatar': function () {
        var user = Meteor.users.findOne({_id:this.toString()},{fields:{"profile.avatar":1}});
        return (user && user.profile && user.profile.avatar) || "/images/logo64.png";
    },
    'avatarBackgroundStyle': function(){
        var user = Meteor.users.findOne({_id:this.toString()},{fields:{"profile.color":1}});
        if(user && user.profile && user.profile.color){
            return 'background-color: '+user.profile.color+';"';
        }
    }
});