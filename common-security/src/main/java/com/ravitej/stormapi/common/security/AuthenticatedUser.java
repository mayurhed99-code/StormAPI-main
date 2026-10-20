package com.ravitej.stormapi.common.security;

/**
 * The authenticated principal extracted from a validated JWT.
 */
public record AuthenticatedUser(long userId, String email) {
}
