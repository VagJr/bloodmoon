import test from 'node:test';
import assert from 'node:assert/strict';
import {projectilePosition} from '../client/realm-vfx.js';

test('projectile artwork advances every frame between server updates',()=>{
 const shot={x:10,y:20,velocityX:4,velocityY:-2,updatedAt:1000,expiresAt:2000};
 assert.deepEqual(projectilePosition(shot,1250),{x:11,y:19.5});
 assert.deepEqual(projectilePosition(shot,1500),{x:12,y:19});
 assert.deepEqual(projectilePosition(shot,2000),{x:14,y:18});
});
