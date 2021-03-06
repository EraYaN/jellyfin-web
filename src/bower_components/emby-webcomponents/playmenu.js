define(["actionsheet", "datetime", "playbackManager", "globalize", "appSettings"], function(actionsheet, datetime, playbackManager, globalize, appSettings) {
    "use strict";

    function show(options) {
        var item = options.item,
            itemType = item.Type,
            isFolder = item.IsFolder,
            itemId = item.Id,
            channelId = item.ChannelId,
            serverId = item.ServerId,
            resumePositionTicks = item.UserData ? item.UserData.PlaybackPositionTicks : null,
            playableItemId = "Program" === itemType ? channelId : itemId;
        if (!resumePositionTicks || isFolder) return void playbackManager.play({
            ids: [playableItemId],
            serverId: serverId
        });
        var menuItems = [];
        menuItems.push({
            name: globalize.translate("sharedcomponents#ResumeAt", datetime.getDisplayRunningTime(resumePositionTicks)),
            id: "resume"
        }), menuItems.push({
            name: globalize.translate("sharedcomponents#PlayFromBeginning"),
            id: "play"
        }), actionsheet.show({
            items: menuItems,
            positionTo: options.positionTo
        }).then(function(id) {
            switch (id) {
                case "play":
                    playbackManager.play({
                        ids: [playableItemId],
                        serverId: serverId
                    });
                    break;
                case "resume":
                    playbackManager.play({
                        ids: [playableItemId],
                        startPositionTicks: resumePositionTicks,
                        serverId: serverId
                    });
                    break;
                case "queue":
                    playbackManager.queue({
                        items: [item]
                    });
                    break;
                case "shuffle":
                    playbackManager.shuffle(item)
            }
        })
    }
    return {
        show: show
    }
});